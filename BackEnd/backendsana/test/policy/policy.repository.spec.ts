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