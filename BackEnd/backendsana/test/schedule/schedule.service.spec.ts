import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ScheduleService } from '../../src/schedule/schedule.service.js';

function user(overrides: Record<string, unknown> = {}) {
  return {
    userId: 10,
    personId: 10,
    email: 'psy@example.com',
    roles: ['psicologo'],
    auth0Subject: 'auth0|psy-10',
    state: 'activo',
    ...overrides,
  };
}

function setup() {
  const repository = {
    findBlocks: vi.fn().mockResolvedValue([]),
    hasOverlap: vi.fn().mockResolvedValue(false),
    createBlock: vi.fn().mockResolvedValue({ id: 1 }),
    deleteBlock: vi.fn().mockResolvedValue(true),
    findRecurringBlocks: vi.fn().mockResolvedValue([]),
    hasRecurringOverlap: vi.fn().mockResolvedValue(false),
    createRecurringBlock: vi.fn().mockResolvedValue({ id: 2 }),
    deleteRecurringBlock: vi.fn().mockResolvedValue(true),
    findAvailability: vi.fn().mockResolvedValue([]),
  };
  return { service: new ScheduleService(repository as never), repository };
}

describe('ScheduleService', () => {
  it('lists and creates blocks for the authenticated psychologist', async () => {
    const { service, repository } = setup();
    const psychologist = user();

    await service.findMyBlocks(psychologist as never);
    await service.createMyBlock(psychologist as never, {
      date: '2026-10-15',
      startTime: '09:00',
      endTime: '12:00',
      reason: 'Trabajo externo',
    });

    expect(repository.findBlocks).toHaveBeenCalledWith(10);
    expect(repository.createBlock).toHaveBeenCalledWith({
      psychologistId: 10,
      date: '2026-10-15',
      startTime: '09:00',
      endTime: '12:00',
      reason: 'Trabajo externo',
    });
  });

  it('rejects non-psychologists', async () => {
    const { service } = setup();

    await expect(
      service.findMyBlocks(user({ roles: ['secretario'] }) as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an invalid time range', async () => {
    const { service, repository } = setup();

    await expect(
      service.createMyBlock(user() as never, {
        date: '2026-10-15',
        startTime: '12:00',
        endTime: '09:00',
        reason: 'Trabajo externo',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.hasOverlap).not.toHaveBeenCalled();
  });

  it('rejects an overlapping block', async () => {
    const { service, repository } = setup();
    repository.hasOverlap.mockResolvedValue(true);

    await expect(
      service.createMyBlock(user() as never, {
        date: '2026-10-15',
        startTime: '09:00',
        endTime: '12:00',
        reason: 'Trabajo externo',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createBlock).not.toHaveBeenCalled();
  });

  it('reports a missing or appointment-owned block on delete', async () => {
    const { service, repository } = setup();
    repository.deleteBlock.mockResolvedValue(false);

    await expect(
      service.deleteMyBlock(user() as never, 20),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.deleteBlock).toHaveBeenCalledWith(10, 20);
  });

  it('creates a weekly recurring block', async () => {
    const { service, repository } = setup();

    await service.createMyRecurringBlock(user() as never, {
      dayOfWeek: 2,
      startTime: '08:00',
      endTime: '12:00',
      validFrom: '2026-10-01',
      validUntil: '2026-12-31',
      reason: 'Trabajo externo',
    });

    expect(repository.createRecurringBlock).toHaveBeenCalledWith({
      psychologistId: 10,
      dayOfWeek: 2,
      startTime: '08:00',
      endTime: '12:00',
      validFrom: '2026-10-01',
      validUntil: '2026-12-31',
      reason: 'Trabajo externo',
    });
  });

  it('rejects an invalid recurring validity range', async () => {
    const { service, repository } = setup();

    await expect(
      service.createMyRecurringBlock(user() as never, {
        dayOfWeek: 2,
        startTime: '08:00',
        endTime: '12:00',
        validFrom: '2026-12-31',
        validUntil: '2026-10-01',
        reason: 'Trabajo externo',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.hasRecurringOverlap).not.toHaveBeenCalled();
  });

  it('rejects overlapping recurring rules', async () => {
    const { service, repository } = setup();
    repository.hasRecurringOverlap.mockResolvedValue(true);

    await expect(
      service.createMyRecurringBlock(user() as never, {
        dayOfWeek: 2,
        startTime: '08:00',
        endTime: '12:00',
        validFrom: '2026-10-01',
        reason: 'Trabajo externo',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createRecurringBlock).not.toHaveBeenCalled();
  });

  it('groups the secretary availability query by slot and psychologist', async () => {
    const { service, repository } = setup();
    repository.findAvailability.mockResolvedValue([
      {
        date: '2026-10-06',
        startTime: '09:00:00',
        endTime: '10:00:00',
        psychologistId: 10,
        psychologistName: 'Ana',
        speciality: 'Infantil',
      },
      {
        date: '2026-10-06',
        startTime: '09:00:00',
        endTime: '10:00:00',
        psychologistId: 11,
        psychologistName: 'Luis',
        speciality: 'General',
      },
    ]);

    await expect(
      service.findAvailability({
        appointmentStart: '2026-10-06T09:00:00.000Z',
        duration: 60,
        delayHours: 2,
      }),
    ).resolves.toEqual([
      {
        date: '2026-10-06',
        startTime: '09:00:00',
        endTime: '10:00:00',
        psychologists: [
          { id: 10, name: 'Ana', speciality: 'Infantil' },
          { id: 11, name: 'Luis', speciality: 'General' },
        ],
      },
    ]);
  });
});
