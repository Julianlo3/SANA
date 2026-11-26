import { describe, expect, it, vi } from 'vitest';
import { EmailRepository } from '../../src/email/email.repository.js';

describe('EmailRepository', () => {
  it('persists queued messages as pending', async () => {
    const dataSource = { query: vi.fn().mockResolvedValue([{ email_id: 9 }]) };
    const repository = new EmailRepository(dataSource as never);

    await expect(
      repository.enqueue({
        to: 'person@example.com',
        subject: 'Aviso',
        text: 'Mensaje',
      }),
    ).resolves.toBe(9);

    expect(dataSource.query.mock.calls[0][0]).toContain(
      'INSERT INTO email_outbox',
    );
    expect(dataSource.query.mock.calls[0][1]).toEqual([
      'person@example.com',
      'Aviso',
      'Mensaje',
      null,
    ]);
  });

  it('claims due rows with skip-locked leases for recovery across workers', async () => {
    const dataSource = { query: vi.fn().mockResolvedValue([]) };
    const repository = new EmailRepository(dataSource as never);

    await repository.claimDue(10, 300);

    expect(dataSource.query.mock.calls[0][0]).toContain(
      'FOR UPDATE SKIP LOCKED',
    );
    expect(dataSource.query.mock.calls[0][0]).toContain(
      "email_status = 'sending'",
    );
    expect(dataSource.query.mock.calls[0][0]).not.toContain(
      "email_status = 'sent'",
    );
    expect(dataSource.query.mock.calls[0][1]).toEqual([10, 300]);
  });

  it('normalizes TypeORM UPDATE ... RETURNING results before delivery', async () => {
    const row = {
      email_id: 12,
      email_to: 'person@example.com',
      email_subject: 'Aviso',
      email_text: 'Mensaje',
      email_html: null,
      email_attempts: 1,
    };
    const dataSource = { query: vi.fn().mockResolvedValue([[row], 1]) };
    const repository = new EmailRepository(dataSource as never);

    await expect(repository.claimDue(10, 300)).resolves.toEqual([row]);
  });

  it('preserves message content after successful delivery', async () => {
    const dataSource = { query: vi.fn().mockResolvedValue([]) };
    const repository = new EmailRepository(dataSource as never);

    await repository.markSent(9);

    expect(dataSource.query.mock.calls[0][0]).toContain(
      "email_status = 'sent'",
    );
    const sql = dataSource.query.mock.calls[0][0] as string;
    expect(sql).not.toMatch(/email_(to|subject|text|html)\s*=\s*NULL/);
    expect(sql).toContain('email_sent_at = now()');
  });
  it('passes the attempt limit and fails the row, scrubbing its content, when reached', async () => {
    const dataSource = { query: vi.fn().mockResolvedValue([]) };
    const repository = new EmailRepository(dataSource as never);

    await repository.scheduleRetry(5, 60_000, 'EAUTH', 8);

    const sql = dataSource.query.mock.calls[0][0] as string;
    expect(dataSource.query.mock.calls[0][1]).toEqual([5, 60_000, 'EAUTH', 8]);
    expect(sql).toContain("'failed'");
    expect(sql).toContain('email_attempts >= $4');
    expect(sql).toMatch(/email_to = CASE WHEN email_attempts >= \$4 THEN NULL/);
    expect(sql).toMatch(
      /email_text = CASE WHEN email_attempts >= \$4 THEN NULL/,
    );
  });

  it('returns null from findNextWakeAt when no pending retries or sending locks exist', async () => {
    const dataSource = {
      query: vi.fn().mockResolvedValue([{ next_wake_at: null }]),
    };
    const repository = new EmailRepository(dataSource as never);

    await expect(repository.findNextWakeAt(300)).resolves.toBeNull();

    const sql = dataSource.query.mock.calls[0][0] as string;
    expect(sql).toContain('LEAST(');
    expect(sql).toContain("email_status = 'pending'");
    expect(sql).toContain("email_status = 'sending'");
    expect(dataSource.query.mock.calls[0][1]).toEqual([300]);
  });

  it('parses the earliest next wake timestamp from findNextWakeAt', async () => {
    const expectedIso = '2026-11-26T18:30:00.000Z';
    const dataSource = {
      query: vi.fn().mockResolvedValue([{ next_wake_at: expectedIso }]),
    };
    const repository = new EmailRepository(dataSource as never);

    const nextWake = await repository.findNextWakeAt(300);

    expect(nextWake).toBeInstanceOf(Date);
    expect(nextWake?.toISOString()).toBe(expectedIso);
  });
});
