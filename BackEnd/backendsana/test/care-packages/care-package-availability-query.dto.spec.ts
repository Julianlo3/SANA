import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  ApproveCarePackageDto,
  CarePackageAvailabilityQueryDto,
  CreateCarePackageDto,
  SuggestCarePackageDto,
} from '../../src/care-packages/dto/care-package.dto.js';

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

describe('CarePackage sessionLimit DTO validation (3 to 12 sessions)', () => {
  it.each([3, 6, 12])(
    'accepts valid sessionLimit %i in SuggestCarePackageDto, CreateCarePackageDto and ApproveCarePackageDto',
    async (sessionLimit) => {
      const suggestDto = plainToInstance(SuggestCarePackageDto, {
        assessmentAppointmentId: 1,
        sessionLimit,
        priority: 'alta',
      });
      const createDto = plainToInstance(CreateCarePackageDto, {
        assessmentAppointmentId: 1,
        sessionLimit,
        priority: 'media',
      });
      const approveDto = plainToInstance(ApproveCarePackageDto, {
        sessionLimit,
      });

      await expect(validate(suggestDto)).resolves.toHaveLength(0);
      await expect(validate(createDto)).resolves.toHaveLength(0);
      await expect(validate(approveDto)).resolves.toHaveLength(0);
    },
  );

  it.each([0, 1, 2, 13, 20])(
    'rejects invalid sessionLimit %i outside 3..12 across package DTOs',
    async (sessionLimit) => {
      const suggestDto = plainToInstance(SuggestCarePackageDto, {
        assessmentAppointmentId: 1,
        sessionLimit,
        priority: 'alta',
      });
      const createDto = plainToInstance(CreateCarePackageDto, {
        assessmentAppointmentId: 1,
        sessionLimit,
        priority: 'media',
      });
      const approveDto = plainToInstance(ApproveCarePackageDto, {
        sessionLimit,
      });

      const suggestErrors = await validate(suggestDto);
      const createErrors = await validate(createDto);
      const approveErrors = await validate(approveDto);

      expect(suggestErrors.some((e) => e.property === 'sessionLimit')).toBe(true);
      expect(createErrors.some((e) => e.property === 'sessionLimit')).toBe(true);
      expect(approveErrors.some((e) => e.property === 'sessionLimit')).toBe(true);
    },
  );
});
