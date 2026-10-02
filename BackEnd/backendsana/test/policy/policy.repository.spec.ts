import { describe, expect, it, vi } from 'vitest';
import { PolicyRepository } from '../../src/policy/policy.repository.js';

function setup() {
  const dataSource = {
    query: vi.fn(),
  };

  return {
    repository: new PolicyRepository(dataSource as never),
    dataSource,
  };
}

describe('PolicyRepository.getCurrentPolicyDocument', () => {
  it('returns the latest document for the requested type', async () => {
    const { repository, dataSource } = setup();
    const effectiveFrom = new Date('2026-09-01T00:00:00.000Z');
    dataSource.query.mockResolvedValue([
      {
        pd_id: 12,
        pd_type: 'schedule_terms',
        pd_version: '2.0',
        pd_content: 'Latest terms',
        pd_effective_from: effectiveFrom,
      },
    ]);

    await expect(
      repository.getCurrentPolicyDocument('schedule_terms'),
    ).resolves.toEqual({
      id: 12,
      type: 'schedule_terms',
      version: '2.0',
      content: 'Latest terms',
      effectiveFrom,
    });
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY pd_effective_from DESC, pd_id DESC'),
      ['schedule_terms'],
    );
  });

  it('returns null when the policy type has no document', async () => {
    const { repository, dataSource } = setup();
    dataSource.query.mockResolvedValue([]);

    await expect(
      repository.getCurrentPolicyDocument('unknown'),
    ).resolves.toBeNull();
  });
});

describe('PolicyRepository.recordAcceptance', () => {
  it('uses one conflict handler and returns the inserted acceptance ID', async () => {
    const { repository, dataSource } = setup();
    dataSource.query
      .mockResolvedValueOnce([{ pd_id: 12 }])
      .mockResolvedValueOnce([{ pa_id: 91 }]);

    await expect(
      repository.recordAcceptance({
        personId: 7,
        policyType: 'schedule_terms',
        ipAddress: '127.0.0.1',
      }),
    ).resolves.toBe(91);

    const insertSql = dataSource.query.mock.calls[1][0] as string;
    expect((insertSql.match(/ON CONFLICT/g) ?? [])).toHaveLength(1);
    expect(insertSql).toContain('ON CONFLICT DO NOTHING');
    expect(dataSource.query.mock.calls[1][1]).toEqual([
      7,
      null,
      null,
      12,
      '127.0.0.1',
      null,
    ]);
  });

  it('recovers only an existing acceptance with the same nullable context', async () => {
    const { repository, dataSource } = setup();
    dataSource.query
      .mockResolvedValueOnce([{ pd_id: 12 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ pa_id: 91 }]);

    await expect(
      repository.recordAcceptance({
        personId: 7,
        policyType: 'schedule_terms',
      }),
    ).resolves.toBe(91);

    const lookupSql = dataSource.query.mock.calls[2][0] as string;
    expect(lookupSql).toContain('dep_id IS NOT DISTINCT FROM $3::int');
    expect(lookupSql).toContain('cn_id IS NOT DISTINCT FROM $4::int');
    expect(lookupSql).toContain('app_id IS NOT DISTINCT FROM $5::int');
  });
});