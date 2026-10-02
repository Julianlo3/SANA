import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ScheduleAvailabilityQueryDto } from '../../src/schedule/dto/schedule-availability-query.dto.js';

describe('ScheduleAvailabilityQueryDto', () => {
  it('transforms string query params into numbers and passes validation', async () => {
    const rawQuery = {
      appointmentStart: '2026-10-15T10:00:00.000Z',
      duration: '30',
      delayHours: '4',
      psychologistIds: '1,2,3',
    };

    const instance = plainToInstance(ScheduleAvailabilityQueryDto, rawQuery);
    expect(instance.duration).toBe(30);
    expect(instance.delayHours).toBe(4);

    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
  });

  it('fails validation when duration is not an integer or is outside bounds', async () => {
    const rawQuery = {
      appointmentStart: '2026-10-15T10:00:00.000Z',
      duration: '0',
      delayHours: '4',
    };

    const instance = plainToInstance(ScheduleAvailabilityQueryDto, rawQuery);
    const errors = await validate(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'duration')).toBe(true);
  });

  it('fails validation when delayHours exceeds bounds', async () => {
    const rawQuery = {
      appointmentStart: '2026-10-15T10:00:00.000Z',
      duration: '30',
      delayHours: '25',
    };

    const instance = plainToInstance(ScheduleAvailabilityQueryDto, rawQuery);
    const errors = await validate(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'delayHours')).toBe(true);
  });

  it('fails validation gracefully when a non-numeric string like "a" is sent', async () => {
    const rawQuery = {
      appointmentStart: '2026-10-15T10:00:00.000Z',
      duration: 'a',
      delayHours: '4',
    };

    const instance = plainToInstance(ScheduleAvailabilityQueryDto, rawQuery);
    expect(Number.isNaN(instance.duration)).toBe(true);

    const errors = await validate(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'duration')).toBe(true);
  });
});
