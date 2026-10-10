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
    findCalendar: vi.fn().mockResolvedValue({ availability: [], occupancy: [] }),
    hasOverlap: vi.fn().mockResolvedValue(false),
    createBlock: vi.fn().mockResolvedValue({ id: 1 }),
    deleteBlock: vi.fn().mockResolvedValue(true),
    findRecurringBlocks: vi.fn().mockResolvedValue([]),
    hasRecurringOverlap: vi.fn().mockResolvedValue(false),
    createRecurringBlock: vi.fn().mockResolvedValue({ id: 2 }),
    deleteRecurringBlock: vi.fn().mockResolvedValue(true),
    findAvailability: vi.fn().mockResolvedValue([]),
    assignAppointmentSlot: vi.fn().mockResolvedValue('assigned'),
  };
  const policyService = {
    hasPsychologistAcceptedScheduleTerms: vi.fn().mockResolvedValue(true),
  };
  return { service: new ScheduleService(repository as never, policyService as never), repository, policyService };
}

describe('ScheduleService', () => {
  it('lists and creates blocks for the authenticated psychologist', async () => {
    const { service, repository, policyService } = setup();
    const psychologist = user();

    await service.findMyBlocks(psychologist as never);
    await service.createMyBlock(psychologist as never, {
      date: '2026-10-15',
      startTime: '09:00',
      endTime: '12:00',
      reason: 'Trabajo externo',
    });

    expect(repository.findBlocks).toHaveBeenCalledWith(10);
    expect(policyService.hasPsychologistAcceptedScheduleTerms).toHaveBeenCalledWith(10);
    expect(repository.createBlock).toHaveBeenCalledWith({
      psychologistId: 10,
      date: '2026-10-15',
      startTime: '09:00',
      endTime: '12:00',
      reason: 'Trabajo externo',
    });
  });

  it('lists schedule blocks for the requested psychologist', async () => {
    const { service, repository } = setup();
    const blocks = [{ id: 5, date: '2026-10-15' }];
    repository.findBlocks.mockResolvedValue(blocks);

    await expect(service.findPsychologistBlocks(5)).resolves.toBe(blocks);
    expect(repository.findBlocks).toHaveBeenCalledWith(5);
  });

  it('rejects a non-positive psychologist ID when listing their blocks', async () => {
    const { service, repository } = setup();

    await expect(service.findPsychologistBlocks(0)).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'INVALID_PSYCHOLOGIST_ID' }),
    });
    expect(repository.findBlocks).not.toHaveBeenCalled();
  });

  it('returns availability and occupancy together for the requested psychologist calendar', async () => {
    const { service, repository } = setup();
    const recurring = [{
      id: 12,
      dayOfWeek: 2,
      startTime: '09:00:00',
      endTime: '12:00:00',
      validFrom: '2026-10-01',
      validUntil: null,
      reason: 'Disponibilidad semanal',
      active: true,
    }];
    const calendar = {
      availability: [{ id: 3, date: '2026-10-15', startTime: '09:00:00', endTime: '12:00:00' }],
      occupancy: [{
        id: 8,
        date: '2026-10-15',
        startTime: '10:00:00',
        endTime: '11:00:00',
        sourceType: 'appointment',
        appointmentId: 42,
      }],
      recurring,
    };
    repository.findCalendar.mockResolvedValue(calendar);

    await expect(service.findPsychologistCalendar(5)).resolves.toBe(calendar);
    expect(repository.findCalendar).toHaveBeenCalledWith(5);
    expect(calendar.recurring).toEqual(recurring);
  });

  it('rejects an invalid psychologist ID when requesting their calendar', async () => {
    const { service, repository } = setup();

    await expect(service.findPsychologistCalendar(-1)).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'INVALID_PSYCHOLOGIST_ID' }),
    });
    expect(repository.findCalendar).not.toHaveBeenCalled();
  });

  it('rejects non-psychologists', async () => {
    const { service, repository } = setup();

    await expect(
      service.findMyBlocks(user({ roles: ['secretario'] }) as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findBlocks).not.toHaveBeenCalled();
  });

  it('rejects an invalid time range', async () => {
    const { service, repository, policyService } = setup();

    await expect(
      service.createMyBlock(user() as never, {
        date: '2026-10-15',
        startTime: '12:00',
        endTime: '09:00',
        reason: 'Trabajo externo',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(policyService.hasPsychologistAcceptedScheduleTerms).not.toHaveBeenCalled();
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
    const { service, repository, policyService } = setup();

    await service.createMyRecurringBlock(user() as never, {
      dayOfWeek: 2,
      startTime: '08:00',
      endTime: '12:00',
      validFrom: '2026-10-01',
      validUntil: '2026-12-31',
      reason: 'Trabajo externo',
    });

    expect(policyService.hasPsychologistAcceptedScheduleTerms).toHaveBeenCalledWith(10);
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
    const { service, repository, policyService } = setup();

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
    expect(policyService.hasPsychologistAcceptedScheduleTerms).not.toHaveBeenCalled();
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

  it('delegates assignment and occupancy persistence to one repository transaction', async () => {
    const { service, repository } = setup();
    const result = await service.assignAppointmentSlot({
      appId: 25,
      secretaryUserId: 99,
      psychologistId: 10,
      appDate: new Date('2026-10-15T09:00:00.000Z'),
      duration: 60,
    });

    expect(result).toBe('assigned');
    expect(repository.assignAppointmentSlot).toHaveBeenCalledWith({
      appId: 25,
      secretaryUserId: 99,
      psyId: 10,
      appDate: new Date('2026-10-15T09:00:00.000Z'),
      appDuration: 60,
    });
  });

  it('returns the repository conflict result without creating an occupancy separately', async () => {
    const { service, repository } = setup();
    repository.assignAppointmentSlot.mockResolvedValue('slot_taken');

    const result = await service.assignAppointmentSlot({
      appId: 25,
      secretaryUserId: 99,
      psychologistId: 10,
      appDate: new Date('2026-10-15T09:00:00.000Z'),
      duration: 60,
    });

    expect(result).toBe('slot_taken');
  });
});
