import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';
import { EmailRepository, type EmailOutboxRow } from './email.repository.js';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface GmailOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
}

export interface EmailTransport {
  sendMail(message: EmailMessage & { from: string }): Promise<unknown>;
}

export type EmailTransportFactory = (options: GmailOptions) => EmailTransport;
export const EMAIL_TRANSPORT_FACTORY = Symbol('EMAIL_TRANSPORT_FACTORY');

const POLL_INTERVAL_MS = 15_000;
const BATCH_SIZE = 10;
const STALE_LOCK_SECONDS = 300;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 8;

/**
 * Service for managing email delivery, including queuing, sending, and retrying failed emails.
 */
@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private readonly sender: string | null;
  private readonly transport: EmailTransport | null;
  private pollTimer: ReturnType<typeof setInterval> | undefined;
  private processing = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly repository: EmailRepository,
    @Inject(EMAIL_TRANSPORT_FACTORY)
    transportFactory: EmailTransportFactory,
  ) {
    const config = this.readGmailConfig();
    if (!config) {
      this.sender = null;
      this.transport = null;
      this.logger.warn(
        'Email delivery disabled: Gmail API configuration is missing or invalid',
      );
      return;
    }

    try {
      this.sender = config.from;
      this.transport = transportFactory(config.options);
    } catch (error) {
      this.sender = null;
      this.transport = null;
      this.logger.warn(
        `Email delivery disabled: Gmail API client could not be initialized (${this.errorCode(error)})`,
      );
    }
  }

  onModuleInit(): void {
    if (!this.transport) return;
    this.pollTimer = setInterval(
      () => void this.processPendingEmails(),
      POLL_INTERVAL_MS,
    );
    this.pollTimer.unref?.();
    void this.processPendingEmails();
  }

  onModuleDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  /**
   * Enqueues an email for sending.
   * @param message The email message to enqueue.
   * @returns A promise resolving when the email is queued.
   */
  async enqueueEmail(message: EmailMessage): Promise<void> {
    if (!this.transport || !this.sender) {
      this.logger.warn(
        'Email skipped because Gmail API delivery is not configured',
      );
      return;
    }

    const recipient = typeof message?.to === 'string' ? message.to.trim() : '';
    const subject =
      typeof message?.subject === 'string' ? message.subject.trim() : '';
    const text = typeof message?.text === 'string' ? message.text.trim() : '';
    if (!recipient || !isEmail(recipient)) {
      this.logger.warn(
        'Email skipped because the recipient address is missing or invalid',
      );
      return;
    }
    if (!subject || !text) {
      this.logger.warn('Email skipped because its subject or body is empty');
      return;
    }

    try {
      const emailId = await this.repository.enqueue({
        to: recipient,
        subject,
        text,
        ...(typeof message.html === 'string' && message.html
          ? { html: message.html }
          : {}),
      });
      this.logger.log(`Email queued: emailId-${emailId}`);
      void this.processPendingEmails();
    } catch (error) {
      this.logger.error(`Email could not be queued (${this.errorCode(error)})`);
    }
  }

  /**
   * Processes pending emails for sending.
   * @returns A promise resolving when the processing is complete.
   */
  async processPendingEmails(): Promise<void> {
    if (!this.transport || !this.sender || this.processing) return;

    this.processing = true;
    try {
      const queued = await this.repository.claimDue(
        BATCH_SIZE,
        STALE_LOCK_SECONDS,
      );
      await Promise.all(queued.map((email) => this.processClaimedEmail(email)));
    } catch (error) {
      this.logger.error(
        `Email outbox processing failed (${this.errorCode(error)})`,
      );
    } finally {
      this.processing = false;
    }
  }

  /** Reads the OAuth2 configuration required by the Gmail API. */
  private readGmailConfig(): { from: string; options: GmailOptions } | null {
    const clientId = this.configService.get<string>('GMAIL_CLIENT_ID')?.trim();
    const clientSecret = this.configService
      .get<string>('GMAIL_CLIENT_SECRET')
      ?.trim();
    const redirectUri = this.configService
      .get<string>('GMAIL_REDIRECT_URI')
      ?.trim();
    const refreshToken = this.configService
      .get<string>('GMAIL_REFRESH_TOKEN')
      ?.trim();
    const from = this.configService.get<string>('GMAIL_FROM')?.trim();

    if (
      !clientId ||
      !clientSecret ||
      !redirectUri ||
      !refreshToken ||
      !from ||
      !isEmail(from)
    ) {
      return null;
    }
    try {
      new URL(redirectUri);
    } catch {
      return null;
    }
    return {
      from,
      options: { clientId, clientSecret, redirectUri, refreshToken },
    };
  }

  /**
   * Processes a claimed email for sending.
   * @param email The email to process.
   * @returns A promise resolving when the processing is complete.
   */
  private async processClaimedEmail(email: EmailOutboxRow): Promise<void> {
    try {
      await this.transport!.sendMail({
        from: this.sender!,
        to: email.email_to,
        subject: email.email_subject,
        text: email.email_text,
        ...(email.email_html ? { html: email.email_html } : {}),
      });
    } catch (error) {
      const delay = Math.min(
        30_000 * 2 ** Math.max(0, email.email_attempts - 1),
        MAX_RETRY_DELAY_MS,
      );
      const errorCode = this.errorCode(error);
      try {
        await this.repository.scheduleRetry(
          email.email_id,
          delay,
          errorCode,
          MAX_ATTEMPTS,
        );
      } catch (retryError) {
        this.logger.error(
          `Email retry could not be saved: emailId-${email.email_id}, code-${this.errorCode(retryError)}`,
        );
      }
      this.logger.warn(
        `Email delivery failed and will be retried: emailId-${email.email_id}, attempt-${email.email_attempts}, code-${errorCode}`,
      );
      return;
    }

    try {
      await this.repository.markSent(email.email_id);
      this.logger.log(`Email sent: emailId-${email.email_id}`);
    } catch (error) {
      this.logger.error(
        `Email was sent but its outbox status could not be updated: emailId-${email.email_id}, code-${this.errorCode(error)}`,
      );
    }
  }

  /**
   * Extracts an error code from a given error object.
   * @param error The error object.
   * @returns The error code or a default value.
   */
  private errorCode(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code?: unknown }).code;
      if (typeof code === 'string' && /^[A-Za-z0-9_-]+$/.test(code))
        return code.slice(0, 80);
    }
    return 'GMAIL_API_ERROR';
  }
}
