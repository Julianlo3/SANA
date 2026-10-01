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

export interface SmtpOptions {
  host: string;
  port: number;
  secure: true;
  tls: { minVersion: 'TLSv1.2'; rejectUnauthorized: true };
  auth?: { user: string; pass: string };
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
}

export interface SmtpTransport {
  sendMail(message: EmailMessage & { from: string }): Promise<unknown>;
}

export type SmtpTransportFactory = (options: SmtpOptions) => SmtpTransport;
export const SMTP_TRANSPORT_FACTORY = Symbol('SMTP_TRANSPORT_FACTORY');

const POLL_INTERVAL_MS = 15_000;
const BATCH_SIZE = 10;
const STALE_LOCK_SECONDS = 300;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

/**
 * Service for managing email delivery, including queuing, sending, and retrying failed emails.
 */
@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private readonly sender: string | null;
  private readonly transport: SmtpTransport | null;
  private pollTimer: ReturnType<typeof setInterval> | undefined;
  private processing = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly repository: EmailRepository,
    @Inject(SMTP_TRANSPORT_FACTORY)
    transportFactory: SmtpTransportFactory,
  ) {
    const config = this.readSmtpConfig();
    if (!config) {
      this.sender = null;
      this.transport = null;
      this.logger.warn('Email delivery disabled: SMTP configuration is missing or invalid');
      return;
    }

    try {
      this.sender = config.from;
      this.transport = transportFactory(config.options);
    } catch (error) {
      this.sender = null;
      this.transport = null;
      this.logger.warn(`Email delivery disabled: SMTP transport could not be initialized (${this.errorCode(error)})`);
    }
  }

  onModuleInit(): void {
    if (!this.transport) return;
    this.pollTimer = setInterval(() => void this.processPendingEmails(), POLL_INTERVAL_MS);
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
      this.logger.warn('Email skipped because SMTP delivery is not configured');
      return;
    }

    const recipient = typeof message?.to === 'string' ? message.to.trim() : '';
    const subject = typeof message?.subject === 'string' ? message.subject.trim() : '';
    const text = typeof message?.text === 'string' ? message.text.trim() : '';
    if (!recipient || !isEmail(recipient)) {
      this.logger.warn('Email skipped because the recipient address is missing or invalid');
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
        ...(typeof message.html === 'string' && message.html ? { html: message.html } : {}),
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
      const queued = await this.repository.claimDue(BATCH_SIZE, STALE_LOCK_SECONDS);
      await Promise.all(queued.map((email) => this.processClaimedEmail(email)));
    } catch (error) {
      this.logger.error(`Email outbox processing failed (${this.errorCode(error)})`);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Reads the SMTP configuration from the environment variables.
   * @returns The SMTP configuration or null if invalid.
   */
  private readSmtpConfig(): { from: string; options: SmtpOptions } | null {
    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const from = this.configService.get<string>('SMTP_FROM')?.trim();
    const rawPort = this.configService.get<string>('SMTP_PORT')?.trim();
    const port = rawPort ? Number(rawPort) : 587;
    const rawSecure = this.configService.get<string>('SMTP_SECURE')?.trim().toLowerCase();
    const secure = rawSecure ? rawSecure === 'true' : port === 465;
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const password = this.configService.get<string>('SMTP_PASSWORD');

    if (
      !host || !from || !isEmail(from) ||
      !Number.isInteger(port) || port < 1 || port > 65535 ||
      (rawSecure && rawSecure !== 'true' && rawSecure !== 'false') ||
      !secure ||
      Boolean(user) !== Boolean(password)
    ) {
      return null;
    }

    return {
      from,
      options: {
        host,
        port,
        secure: true,
        tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
        ...(user && password ? { auth: { user, pass: password } } : {}),
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 30_000,
      },
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
        await this.repository.scheduleRetry(email.email_id, delay, errorCode);
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
      if (typeof code === 'string' && /^[A-Za-z0-9_-]+$/.test(code)) return code.slice(0, 80);
    }
    return 'SMTP_ERROR';
  }
}