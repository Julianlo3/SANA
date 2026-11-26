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
      findNextWakeAt: vi.fn().mockResolvedValue(null),
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

  it('marks the queued message as sent after a successful Gmail API send', async () => {
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
      findNextWakeAt: vi.fn().mockResolvedValue(null),
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

  it('disables email service when ENABLE_EMAIL is false', async () => {
    const repository = {
      enqueue: vi.fn(),
      claimDue: vi.fn(),
    };
    const transport = {
      sendMail: vi.fn(),
    };
    const factory = vi.fn().mockReturnValue(transport);

    const service = new EmailService(
      configuration({
        ENABLE_EMAIL: 'false',
        GMAIL_CLIENT_ID: 'client-id',
        GMAIL_CLIENT_SECRET: 'client-secret',
        GMAIL_REDIRECT_URI: 'https://example.com/oauth/callback',
        GMAIL_REFRESH_TOKEN: 'refresh-token',
        GMAIL_FROM: 'notificaciones@example.com',
      }) as never,
      repository as never,
      factory,
    );

    expect(service.isEnabled()).toBe(false);
    expect(service.isConfigured()).toBe(false);
    expect(factory).not.toHaveBeenCalled();

    await service.enqueueEmail({
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
    });
    expect(repository.enqueue).not.toHaveBeenCalled();

    await service.processPendingEmails();
    expect(repository.claimDue).not.toHaveBeenCalled();
  });

  it('stays completely idle with zero polling queries when the outbox is empty', async () => {
    vi.useFakeTimers();
    try {
      const repository = {
        claimDue: vi.fn().mockResolvedValue([]),
        findNextWakeAt: vi.fn().mockResolvedValue(null),
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
        vi.fn().mockReturnValue({ sendMail: vi.fn() }),
      );

      service.onModuleInit();
      await vi.runAllTimersAsync();

      expect(repository.claimDue).toHaveBeenCalledTimes(1);
      expect(repository.findNextWakeAt).toHaveBeenCalledTimes(1);

      // Advance 2 hours: no periodic polling should hit PostgreSQL
      await vi.advanceTimersByTimeAsync(2 * 60 * 60 * 1000);
      expect(repository.claimDue).toHaveBeenCalledTimes(1);
      expect(repository.findNextWakeAt).toHaveBeenCalledTimes(1);

      service.onModuleDestroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('schedules a single one-shot wake timer for future retries and goes idle once drained', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-11-26T18:00:00.000Z'));
      const retryAt = new Date('2026-11-26T18:00:30.000Z');
      const emailRow = {
        email_id: 21,
        email_to: 'person@example.com',
        email_subject: 'Recordatorio',
        email_text: 'Tu cita es mañana.',
        email_html: null,
        email_attempts: 1,
      };
      const repository = {
        claimDue: vi
          .fn()
          .mockResolvedValueOnce([emailRow])
          .mockResolvedValueOnce([{ ...emailRow, email_attempts: 2 }]),
        scheduleRetry: vi.fn().mockResolvedValue(undefined),
        markSent: vi.fn().mockResolvedValue(undefined),
        findNextWakeAt: vi
          .fn()
          .mockResolvedValueOnce(retryAt)
          .mockResolvedValueOnce(null),
      };
      const transport: EmailTransport = {
        sendMail: vi
          .fn()
          .mockRejectedValueOnce(
            Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }),
          )
          .mockResolvedValueOnce({}),
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
      expect(repository.claimDue).toHaveBeenCalledTimes(1);
      expect(repository.scheduleRetry).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(29_999);
      expect(repository.claimDue).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(repository.claimDue).toHaveBeenCalledTimes(2);
      expect(repository.markSent).toHaveBeenCalledWith(21);

      // Once queue is empty, advancing 1 hour triggers no more queries
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
      expect(repository.claimDue).toHaveBeenCalledTimes(2);

      service.onModuleDestroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-runs immediately when a second email is enqueued while processing is in flight', async () => {
    let releaseFirstSend!: () => void;
    const firstSendBlocked = new Promise<void>((resolve) => {
      releaseFirstSend = resolve;
    });

    const firstRow = {
      email_id: 31,
      email_to: 'patient@example.com',
      email_subject: 'Cita confirmada',
      email_text: 'Confirmación al consultante.',
      email_html: null,
      email_attempts: 1,
    };
    const secondRow = {
      email_id: 32,
      email_to: 'psychologist@example.com',
      email_subject: 'Cita asignada',
      email_text: 'Confirmación al psicólogo.',
      email_html: null,
      email_attempts: 1,
    };
    const repository = {
      enqueue: vi.fn().mockResolvedValueOnce(31).mockResolvedValueOnce(32),
      claimDue: vi
        .fn()
        .mockResolvedValueOnce([firstRow])
        .mockResolvedValueOnce([secondRow]),
      markSent: vi.fn().mockResolvedValue(undefined),
      scheduleRetry: vi.fn(),
      findNextWakeAt: vi.fn().mockResolvedValue(null),
    };
    const transport: EmailTransport = {
      sendMail: vi
        .fn()
        .mockImplementationOnce(async () => {
          await firstSendBlocked;
          return {};
        })
        .mockResolvedValueOnce({}),
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

    await service.enqueueEmail({
      to: 'patient@example.com',
      subject: 'Cita confirmada',
      text: 'Confirmación al consultante.',
    });
    await service.enqueueEmail({
      to: 'psychologist@example.com',
      subject: 'Cita asignada',
      text: 'Confirmación al psicólogo.',
    });

    releaseFirstSend();
    await vi.waitFor(() => {
      expect(repository.markSent).toHaveBeenCalledWith(32);
    });

    expect(repository.claimDue).toHaveBeenCalledTimes(2);
    expect(repository.markSent).toHaveBeenCalledWith(31);
    expect(repository.markSent).toHaveBeenCalledWith(32);
  });

  it('cancels any pending wake timer on module destroy', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-11-26T18:00:00.000Z'));
      const repository = {
        claimDue: vi.fn().mockResolvedValue([]),
        findNextWakeAt: vi
          .fn()
          .mockResolvedValue(new Date('2026-11-26T18:01:00.000Z')),
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
        vi.fn().mockReturnValue({ sendMail: vi.fn() }),
      );

      await service.processPendingEmails();
      expect(repository.claimDue).toHaveBeenCalledTimes(1);

      service.onModuleDestroy();
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      expect(repository.claimDue).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops retrying with bounded backoff after repeated database failures', async () => {
    vi.useFakeTimers();
    try {
      const repository = {
        claimDue: vi
          .fn()
          .mockRejectedValue(Object.assign(new Error('db down'), { code: 'ECONNREFUSED' })),
        findNextWakeAt: vi.fn(),
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
        vi.fn().mockReturnValue({ sendMail: vi.fn() }),
      );

      await service.processPendingEmails();
      expect(repository.claimDue).toHaveBeenCalledTimes(1);

      // Advance well beyond all 5 exponential retries (30s + 60s + 120s + 240s + 480s = 15.5 min)
      await vi.advanceTimersByTimeAsync(2 * 60 * 60 * 1000);
      expect(repository.claimDue).toHaveBeenCalledTimes(6);

      // Should remain paused afterwards
      await vi.advanceTimersByTimeAsync(2 * 60 * 60 * 1000);
      expect(repository.claimDue).toHaveBeenCalledTimes(6);

      service.onModuleDestroy();
    } finally {
      vi.useRealTimers();
    }
  });
});
