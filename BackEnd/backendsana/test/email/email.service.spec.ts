import { describe, expect, it, vi } from 'vitest';
import {
  EmailService,
  type EmailTransport,
  type EmailTransportFactory,
} from '../../src/email/email.service.js';

function configuration(values: Record<string, string> = {}) {
  return {
    get: vi.fn((key: string) => values[key]),
  };
}

describe('EmailService', () => {
  it('skips mail without valid Gmail API settings without touching the outbox', async () => {
    const repository = { enqueue: vi.fn() };
    const factory = vi.fn();
    const service = new EmailService(
      configuration() as never,
      repository as never,
      factory as EmailTransportFactory,
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

  it('persists a retry after a temporary Gmail API failure without throwing', async () => {
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
    const transport: EmailTransport = {
      sendMail: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }),
        ),
    };
    const factory = vi.fn().mockReturnValue(transport);
    const service = new EmailService(
      configuration({
        GMAIL_CLIENT_ID: 'client-id',
        GMAIL_CLIENT_SECRET: 'client-secret',
        GMAIL_REDIRECT_URI: 'https://example.com/oauth/callback',
        GMAIL_REFRESH_TOKEN: 'refresh-token',
        GMAIL_FROM: 'notificaciones@example.com',
      }) as never,
      repository as never,
      factory,
    );

    expect(factory).toHaveBeenCalledWith({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://example.com/oauth/callback',
      refreshToken: 'refresh-token',
    });

    await expect(service.processPendingEmails()).resolves.toBeUndefined();

    expect(repository.scheduleRetry).toHaveBeenCalledWith(
      17,
      30_000,
      'ETIMEDOUT',
      8,
    );
    expect(repository.markSent).not.toHaveBeenCalled();
  });

  it('clears queued message data after a successful Gmail API send', async () => {
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
    const transport: EmailTransport = {
      sendMail: vi.fn().mockResolvedValue({}),
    };
    const service = new EmailService(
      configuration({
        GMAIL_CLIENT_ID: 'client-id',
        GMAIL_CLIENT_SECRET: 'client-secret',
        GMAIL_REDIRECT_URI: 'https://example.com/oauth/callback',
        GMAIL_REFRESH_TOKEN: 'refresh-token',
        GMAIL_FROM: 'notificaciones@example.com',
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

  it('passes OAuth credentials to the Gmail API transport', () => {
    const factory = vi.fn().mockReturnValue({ sendMail: vi.fn() });
    new EmailService(
      configuration({
        GMAIL_CLIENT_ID: 'client-id',
        GMAIL_CLIENT_SECRET: 'client-secret',
        GMAIL_REDIRECT_URI: 'https://example.com/oauth/callback',
        GMAIL_REFRESH_TOKEN: 'refresh-token',
        GMAIL_FROM: 'notificaciones@example.com',
      }) as never,
      { enqueue: vi.fn() } as never,
      factory,
    );

    expect(factory).toHaveBeenCalledWith({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'https://example.com/oauth/callback',
      refreshToken: 'refresh-token',
    });
  });
  it.each([
    { attempts: 1, delay: 30_000 },
    { attempts: 2, delay: 60_000 },
    { attempts: 3, delay: 120_000 },
    { attempts: 8, delay: 3_600_000 }, // 30s * 2^7 = 3.840.000 → tope de 1 hora
  ])(
    'schedules retry with delay $delay and the attempt limit at attempt $attempts',
    async ({ attempts, delay }) => {
      const repository = {
        claimDue: vi.fn().mockResolvedValue([
          {
            email_id: 19,
            email_to: 'person@example.com',
            email_subject: 'Confirmación',
            email_text: 'Tu cita está confirmada.',
            email_html: null,
            email_attempts: attempts,
          },
        ]),
        scheduleRetry: vi.fn().mockResolvedValue(undefined),
        markSent: vi.fn(),
      };
      const transport: EmailTransport = {
        sendMail: vi
          .fn()
          .mockRejectedValue(
            Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }),
          ),
      };
      const service = new EmailService(
        configuration({
          GMAIL_CLIENT_ID: 'client-id',
          GMAIL_CLIENT_SECRET: 'client-secret',
          GMAIL_REDIRECT_URI: 'https://example.com/oauth/callback',
          GMAIL_REFRESH_TOKEN: 'refresh-token',
          GMAIL_FROM: 'notificaciones@example.com',
        }) as never,
        repository as never,
        vi.fn().mockReturnValue(transport),
      );

      await expect(service.processPendingEmails()).resolves.toBeUndefined();

      expect(repository.scheduleRetry).toHaveBeenCalledWith(
        19,
        delay,
        'ETIMEDOUT',
        8,
      );
      expect(repository.markSent).not.toHaveBeenCalled();
    },
  );
});
