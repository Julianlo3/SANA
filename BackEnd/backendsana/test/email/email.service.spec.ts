import { describe, expect, it, vi } from 'vitest';
import {
  EmailService,
  type SmtpTransport,
  type SmtpTransportFactory,
} from '../../src/email/email.service.js';

function configuration(values: Record<string, string> = {}) {
  return {
    get: vi.fn((key: string) => values[key]),
  };
}

describe('EmailService', () => {
  it('skips mail without valid SMTP settings without touching the outbox', async () => {
    const repository = { enqueue: vi.fn() };
    const factory = vi.fn();
    const service = new EmailService(
      configuration() as never,
      repository as never,
      factory as SmtpTransportFactory,
    );

    await expect(
      service.enqueueEmail({
        to: 'person@example.com',
        subject: 'Confirmación',
        text: 'Tu cita está confirmada.',
      }),
    ).resolves.toBeUndefined();

    expect(factory).not.toHaveBeenCalled();
    expect(repository.enqueue).not.toHaveBeenCalled();
  });

  it('persists a retry after a temporary SMTP failure without throwing', async () => {
    const repository = {
      claimDue: vi.fn().mockResolvedValue([
        {
          email_id: 17,
          email_to: 'person@example.com',
          email_subject: 'Confirmación',
          email_text: 'Tu cita está confirmada.',
          email_html: null,
          email_attempts: 1,
        },
      ]),
      scheduleRetry: vi.fn().mockResolvedValue(undefined),
      markSent: vi.fn(),
    };
    const transport: SmtpTransport = {
      sendMail: vi.fn().mockRejectedValue(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })),
    };
    const factory = vi.fn().mockReturnValue(transport);
    const service = new EmailService(
      configuration({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '465',
        SMTP_FROM: 'notificaciones@example.com',
      }) as never,
      repository as never,
      factory,
    );

    expect(factory).toHaveBeenCalledWith(expect.objectContaining({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    }));

    await expect(service.processPendingEmails()).resolves.toBeUndefined();

    expect(repository.scheduleRetry).toHaveBeenCalledWith(17, 30_000, 'ETIMEDOUT');
    expect(repository.markSent).not.toHaveBeenCalled();
  });

  it('clears queued message data after a successful SMTP send', async () => {
    const repository = {
      claimDue: vi.fn().mockResolvedValue([
        {
          email_id: 18,
          email_to: 'person@example.com',
          email_subject: 'Confirmación',
          email_text: 'Tu cita está confirmada.',
          email_html: null,
          email_attempts: 1,
        },
      ]),
      scheduleRetry: vi.fn(),
      markSent: vi.fn().mockResolvedValue(undefined),
    };
    const transport: SmtpTransport = { sendMail: vi.fn().mockResolvedValue({}) };
    const service = new EmailService(
      configuration({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '465',
        SMTP_FROM: 'notificaciones@example.com',
      }) as never,
      repository as never,
      vi.fn().mockReturnValue(transport),
    );

    await service.processPendingEmails();

    expect(transport.sendMail).toHaveBeenCalledWith({
      from: 'notificaciones@example.com',
      to: 'person@example.com',
      subject: 'Confirmación',
      text: 'Tu cita está confirmada.',
    });
    expect(repository.markSent).toHaveBeenCalledWith(18);
    expect(repository.scheduleRetry).not.toHaveBeenCalled();
  });

  it('passes credentials to the transport when user and password are set', () => {
  const factory = vi.fn().mockReturnValue({ sendMail: vi.fn() });
  new EmailService(
    configuration({
      SMTP_HOST: 'smtp.example.com',
      SMTP_FROM: 'notificaciones@example.com',
      SMTP_USER: 'user@example.com',
      SMTP_PASSWORD: 'p@ss:word/#1',
    }) as never,
    { enqueue: vi.fn() } as never,
    factory,
  );

  expect(factory).toHaveBeenCalledWith(
    expect.objectContaining({ auth: { user: 'user@example.com', pass: 'p@ss:word/#1' } }),
  );
});
});