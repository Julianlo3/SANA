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

    expect(dataSource.query.mock.calls[0][0]).toContain('INSERT INTO email_outbox');
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

    expect(dataSource.query.mock.calls[0][0]).toContain('FOR UPDATE SKIP LOCKED');
    expect(dataSource.query.mock.calls[0][0]).toContain("email_status = 'sending'");
    expect(dataSource.query.mock.calls[0][1]).toEqual([10, 300]);
  });

  it('scrubs recipient and body after delivery', async () => {
    const dataSource = { query: vi.fn().mockResolvedValue([]) };
    const repository = new EmailRepository(dataSource as never);

    await repository.markSent(9);

    expect(dataSource.query.mock.calls[0][0]).toContain("email_status = 'sent'");
    expect(dataSource.query.mock.calls[0][0]).toContain('email_text = NULL');
    expect(dataSource.query.mock.calls[0][0]).toContain('email_to = NULL');
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
    expect(sql).toMatch(/email_text = CASE WHEN email_attempts >= \$4 THEN NULL/);
  });
});