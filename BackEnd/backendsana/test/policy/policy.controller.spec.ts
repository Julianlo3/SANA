import { NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it, vi } from 'vitest';
import { PolicyController } from '../../src/policy/policy.controller.js';
import { PolicyRepository } from '../../src/policy/policy.repository.js';
import { PolicyService } from '../../src/policy/policy.service.js';

const NEW_POLICY_TYPES = ['privacy_policy', 'terms_of_use', 'account_terms', 'donation_terms'];

function setup(rows: unknown[]) {
  const dataSource = { query: vi.fn().mockResolvedValue(rows) };
  const controller = new PolicyController(
    new PolicyService(new PolicyRepository(dataSource as never)),
  );
  return { controller, dataSource };
}

describe('PolicyController GET /policy/:type', () => {
  it.each(NEW_POLICY_TYPES)('returns the current %s document', async (type) => {
    const effectiveFrom = new Date('2026-11-08T15:00:00.000Z');
    const { controller, dataSource } = setup([{
      pd_id: 5,
      pd_type: type,
      pd_version: '1.0',
      pd_content: '# Texto',
      pd_effective_from: effectiveFrom,
    }]);

    await expect(controller.getCurrentPolicy(type)).resolves.toEqual({
      id: 5,
      type,
      version: '1.0',
      content: '# Texto',
      effectiveFrom,
    });
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY pd_effective_from DESC, pd_id DESC'),
      [type],
    );
  });

  it('returns 404 for a type without documents', async () => {
    const { controller } = setup([]);

    await expect(controller.getCurrentPolicy('unknown_type')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('stays public: no guards on the controller or on the route', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, PolicyController)).toBeUndefined();
    expect(
      Reflect.getMetadata(GUARDS_METADATA, PolicyController.prototype.getCurrentPolicy),
    ).toBeUndefined();
  });
});
