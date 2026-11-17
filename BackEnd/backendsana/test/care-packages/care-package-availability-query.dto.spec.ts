import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CarePackageAvailabilityQueryDto } from '../../src/care-packages/dto/care-package.dto.js';

describe('CarePackageAvailabilityQueryDto', () => {
  it('accepts a 30-day availability window', async () => {
    const query = plainToInstance(CarePackageAvailabilityQueryDto, {
      appointmentStart: '2026-11-17T13:00:00-05:00',
      duration: '60',
      delayHours: '720',
    });

    expect(query.duration).toBe(60);
    expect(query.delayHours).toBe(720);
    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it('rejects availability windows longer than 30 days', async () => {
    const query = plainToInstance(CarePackageAvailabilityQueryDto, {
      appointmentStart: '2026-11-17T13:00:00-05:00',
      duration: '60',
      delayHours: '721',
    });

    const errors = await validate(query);
    expect(errors.some((error) => error.property === 'delayHours')).toBe(true);
  });
});
