import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface EmailOutboxRow {
  email_id: number;
  email_to: string;
  email_subject: string;
  email_text: string;
  email_html: string | null;
  email_attempts: number;
}

/**
 * Repository for managing email outbox operations.
 */
@Injectable()
export class EmailRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Enqueues an email for sending.
   * @param params The email parameters.
   * @returns A promise resolving to the ID of the enqueued email.
   */
  async enqueue(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<number> {
    const rows = await this.dataSource.query<{ email_id: number }[]>(
      `INSERT INTO email_outbox (email_to, email_subject, email_text, email_html)
       VALUES ($1, $2, $3, $4)
       RETURNING email_id`,
      [params.to, params.subject, params.text, params.html ?? null],
    );
    return rows[0].email_id;
  }

  /**
   * Claims due emails for sending.
   * @param batchSize The maximum number of emails to claim.
   * @param staleLockSeconds The number of seconds after which a locked email is considered stale.
   * @returns A promise resolving to the list of claimed email rows.
   */
  claimDue(batchSize: number, staleLockSeconds: number): Promise<EmailOutboxRow[]> {
    return this.dataSource.query<EmailOutboxRow[]>(
      `WITH candidates AS (
         SELECT email_id
         FROM email_outbox
         WHERE (email_status = 'pending' AND email_next_attempt_at <= now())
            OR (email_status = 'sending'
                AND email_locked_at <= now() - ($2 * interval '1 second'))
         ORDER BY email_next_attempt_at, email_created_at
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       )
       UPDATE email_outbox AS queued
       SET email_status = 'sending',
           email_attempts = queued.email_attempts + 1,
           email_locked_at = now()
       FROM candidates
       WHERE queued.email_id = candidates.email_id
       RETURNING queued.email_id, queued.email_to, queued.email_subject,
                 queued.email_text, queued.email_html, queued.email_attempts`,
      [batchSize, staleLockSeconds],
    );
  }

  /**
   * Marks an email as sent.
   * @param emailId The ID of the email to mark as sent.
   */
  async markSent(emailId: number): Promise<void> {
    await this.dataSource.query(
      `UPDATE email_outbox
       SET email_status = 'sent',
           email_to = NULL,
           email_subject = NULL,
           email_text = NULL,
           email_html = NULL,
           email_locked_at = NULL,
           email_last_error_code = NULL,
           email_sent_at = now()
       WHERE email_id = $1`,
      [emailId],
    );
  }

  /**
   * Schedules a retry for a failed email.
   * @param emailId The ID of the email for which to schedule a retry.
   * @param delayMilliseconds The delay before the next attempt.
   * @param errorCode The error code associated with the failure.
   */
  async scheduleRetry(
    emailId: number,
    delayMilliseconds: number,
    errorCode: string,
    maxAttempts: number,
    ): Promise<void> {
        await this.dataSource.query(
        `UPDATE email_outbox
        SET email_status = CASE WHEN email_attempts >= $4 THEN 'failed' ELSE 'pending' END,
            email_to = CASE WHEN email_attempts >= $4 THEN NULL ELSE email_to END,
            email_subject = CASE WHEN email_attempts >= $4 THEN NULL ELSE email_subject END,
            email_text = CASE WHEN email_attempts >= $4 THEN NULL ELSE email_text END,
            email_html = CASE WHEN email_attempts >= $4 THEN NULL ELSE email_html END,
            email_locked_at = NULL,
            email_next_attempt_at = now() + ($2 * interval '1 millisecond'),
            email_last_error_code = $3
        WHERE email_id = $1`,
    [emailId, delayMilliseconds, errorCode, maxAttempts],
  );
}
}