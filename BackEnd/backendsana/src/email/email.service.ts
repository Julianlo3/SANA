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

const BATCH_SIZE = 10;
const STALE_LOCK_SECONDS = 300;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const MIN_WAKE_DELAY_MS = 1_000;
const MAX_TIMEOUT_MS = 2_147_483_647;
const DB_ERROR_RETRY_BASE_MS = 30_000;
const MAX_DB_ERROR_RETRIES = 5;

/**
 * Service for managing email delivery, including queuing, sending, and retrying failed emails.
 */
@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private readonly sender: string | null;
  private readonly transport: EmailTransport | null;
  private nextWakeTimer: ReturnType<typeof setTimeout> | undefined;
  private processing = false;
  private pendingRerun = false;
  private destroyed = false;
  private consecutiveErrors = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly repository: EmailRepository,
    @Inject(EMAIL_TRANSPORT_FACTORY)
    transportFactory: EmailTransportFactory,
  ) {
    if (!this.isEnabled()) {
      this.sender = null;
      this.transport = null;
      this.logger.log(
        'Email delivery disabled by configuration (ENABLE_EMAIL=false)',
      );
      return;
    }

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

  /**
   * Checks whether email delivery is enabled via configuration.
   */
  isEnabled(): boolean {
    const raw =
      this.configService.get('ENABLE_EMAIL') ??
      this.configService.get('ENABLE_EMAIL_SENDING');

    if (raw === undefined || raw === null || raw === '') {
      return true;
    }
    if (typeof raw === 'boolean') {
      return raw;
    }
    const normalized = String(raw).trim().toLowerCase();
    return normalized !== 'false' && normalized !== '0';
  }

  /**
   * Indicates whether email sending is enabled and configured.
   */
  isConfigured(): boolean {
    return this.isEnabled() && this.transport !== null && this.sender !== null;
  }

  onModuleInit(): void {
    if (!this.isEnabled() || !this.transport) return;
    void this.processPendingEmails();
  }

  onModuleDestroy(): void {
    this.destroyed = true;
    this.clearWakeTimer();
  }

  /**
   * Enqueues an email for sending.
   * @param message The email message to enqueue.
   * @returns A promise resolving when the email is queued.
   */
  async enqueueEmail(message: EmailMessage): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.warn(
        'Email skipped: email sending is disabled by configuration (ENABLE_EMAIL=false)',
      );
      return;
    }

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
   * Processes pending emails for sending and schedules a single wake-up timer
   * only when future retries or locked messages remain in the outbox.
   * @returns A promise resolving when the processing is complete.
   */
  async processPendingEmails(): Promise<void> {
    if (
      !this.isEnabled() ||
      !this.transport ||
      !this.sender ||
      this.destroyed
    ) {
      return;
    }

    if (this.processing) {
      this.pendingRerun = true;
      return;
    }

    this.clearWakeTimer();
    this.processing = true;
    let hadError = false;
    try {
      let shouldContinue: boolean;
      do {
        this.pendingRerun = false;
        const queued = await this.repository.claimDue(
          BATCH_SIZE,
          STALE_LOCK_SECONDS,
        );
        if (queued.length > 0) {
          await Promise.all(
            queued.map((email) => this.processClaimedEmail(email)),
          );
        }
        shouldContinue =
          !this.destroyed &&
          (queued.length >= BATCH_SIZE || this.pendingRerun);
      } while (shouldContinue);
      this.consecutiveErrors = 0;
    } catch (error) {
      hadError = true;
      this.logger.error(
        `Email outbox processing failed (${this.errorCode(error)})`,
      );
    } finally {
      this.processing = false;
    }

    if (this.destroyed) return;

    if (this.pendingRerun) {
      void this.processPendingEmails();
      return;
    }

    if (hadError) {
      this.scheduleErrorBackoff();
      return;
    }

    await this.scheduleNextWake();
  }

  /** Cancels any pending one-shot wake-up timer. */
  private clearWakeTimer(): void {
    if (this.nextWakeTimer) {
      clearTimeout(this.nextWakeTimer);
      this.nextWakeTimer = undefined;
    }
  }

  /** Schedules a single wake-up timer if the outbox still has future work. */
  private async scheduleNextWake(): Promise<void> {
    if (this.destroyed || this.processing) return;
    try {
      const nextWakeAt = await this.repository.findNextWakeAt(
        STALE_LOCK_SECONDS,
      );
      if (this.destroyed || this.processing || !nextWakeAt) return;
      const delayMs = Math.min(
        Math.max(MIN_WAKE_DELAY_MS, nextWakeAt.getTime() - Date.now()),
        MAX_TIMEOUT_MS,
      );
      this.scheduleWakeAfter(delayMs);
    } catch (error) {
      this.logger.error(
        `Email outbox next wake lookup failed (${this.errorCode(error)})`,
      );
      this.scheduleErrorBackoff();
    }
  }

  /** Schedules a bounded exponential backoff retry after a database failure. */
  private scheduleErrorBackoff(): void {
    if (this.destroyed || this.processing) return;
    this.consecutiveErrors += 1;
    if (this.consecutiveErrors > MAX_DB_ERROR_RETRIES) {
      this.logger.error(
        'Email outbox retry backoff paused after repeated database failures; processing will resume on the next enqueued email',
      );
      return;
    }
    const delayMs = Math.min(
      DB_ERROR_RETRY_BASE_MS * 2 ** (this.consecutiveErrors - 1),
      MAX_RETRY_DELAY_MS,
    );
    this.scheduleWakeAfter(delayMs);
  }

  /** Arms a single unref'd setTimeout for the next outbox wake-up. */
  private scheduleWakeAfter(delayMs: number): void {
    this.clearWakeTimer();
    this.nextWakeTimer = setTimeout(() => {
      this.nextWakeTimer = undefined;
      void this.processPendingEmails();
    }, delayMs);
    this.nextWakeTimer.unref?.();
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
      const errorDetails =
        (error as { response?: { data?: unknown } })?.response?.data
          ? JSON.stringify((error as { response: { data: unknown } }).response.data)
          : error instanceof Error
            ? error.message
            : String(error);
      this.logger.warn(
        `Email delivery failed and will be retried: emailId-${email.email_id}, attempt-${email.email_attempts}, code-${errorCode}, reason-${errorDetails}`,
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
