import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AppointmentsService } from '../../src/appointments/appointments.service.js';

function baseRequest(overrides: Record<string, unknown> = {}) {
  return {
    requesterName: 'Ana Solicitante',
    requesterCardType: 'CC',
    requesterIdentityDocument: '12345678',
    requesterContactNumber: '3001234567',
    requesterBirthdate: '1990-01-01',
    requesterTermsAccepted: true,
    patientType: 'self',
    appType: 'virtual',
    ...overrides,
  };
}

function setup() {
  const repository = {
    relationshipExists: vi.fn().mockResolvedValue(true),
    createRequest: vi.fn().mockResolvedValue(42),
    findById: vi.fn(),
    findPsychologists: vi.fn(),
    discard: vi.fn(),
    confirm: vi.fn(),
  };
  const scheduleService = {
    confirmAppointmentSlot: vi.fn().mockResolvedValue(true),
    assignAppointmentSlot: vi.fn().mockResolvedValue('assigned'),
  };
  return {
    service: new AppointmentsService(repository as never, scheduleService as never),
    repository,
    scheduleService,
  };
}

describe('AppointmentsService.requestAppointment', () => {
  it('rejects a self-request from a minor based on birthdate', async () => {
    const { service, repository } = setup();

    await expect(
      service.requestAppointment(
        baseRequest({ requesterBirthdate: '2010-01-01' }) as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'REQUESTER_MUST_BE_ADULT' }),
    });
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('rejects a dependent who is not a minor', async () => {
    const { service, repository } = setup();

    await expect(
      service.requestAppointment(
        baseRequest({
          patientType: 'dependent',
          dependentName: 'Persona adulta',
          dependentIdentityDocument: '87654321',
          dependentBirthdate: '1990-01-01',
          relationshipId: 1,
          dependentTermsAccepted: true,
        }) as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'DEPENDENT_MUST_BE_MINOR' }),
    });
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('rejects a minor acting as the dependent requester', async () => {
    const { service, repository } = setup();

    await expect(
      service.requestAppointment(
        baseRequest({
          requesterBirthdate: '2010-01-01',
          patientType: 'dependent',
          dependentName: 'Menor a cargo',
          dependentIdentityDocument: '87654321',
          dependentBirthdate: '2015-01-01',
          relationshipId: 1,
          dependentTermsAccepted: true,
        }) as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'REQUESTER_MUST_BE_ADULT' }),
    });
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('validates the complete self request before creating it', async () => {
    const { service, repository } = setup();

    await expect(
      service.requestAppointment(baseRequest() as never),
    ).resolves.toMatchObject({ appId: 42 });
    expect(repository.createRequest).toHaveBeenCalledOnce();
    expect(repository.relationshipExists).not.toHaveBeenCalled();
  });

  it('rejects a missing requester birthdate before persistence', async () => {
    const { service, repository } = setup();

    await expect(
      service.requestAppointment(
        baseRequest({ requesterBirthdate: undefined }) as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createRequest).not.toHaveBeenCalled();
  });
});

describe('AppointmentsService assignment lifecycle', () => {
  it('assigns a pending request to a psychologist with registered availability', async () => {
    const { service, repository, scheduleService } = setup();
    repository.findById
      .mockResolvedValueOnce({ appId: 42, appState: 'pendiente' })
      .mockResolvedValueOnce({ appId: 42, appState: 'asignada', psychologistId: 8 });
    repository.findPsychologists.mockResolvedValue([
      { psyId: 8, name: 'Psicóloga', speciality: 'Infantil', licenseNumber: 1 },
    ]);

    await expect(
      service.assignAppointment(42, {
        psyId: 8,
        appDate: '2026-10-06T09:00:00.000Z',
        appDuration: 60,
      }, 3),
    ).resolves.toMatchObject({ appState: 'asignada' });
    expect(scheduleService.assignAppointmentSlot).toHaveBeenCalledWith({
      appId: 42,
      psychologistId: 8,
      secretaryUserId: 3,
      appDate: new Date('2026-10-06T09:00:00.000Z'),
      duration: 60,
    });
  });

  it('allows reassignment of an already assigned request', async () => {
    const { service, repository, scheduleService } = setup();
    repository.findById
      .mockResolvedValueOnce({ appId: 42, appState: 'asignada', psychologistId: 8 })
      .mockResolvedValueOnce({ appId: 42, appState: 'asignada', psychologistId: 9 });
    repository.findPsychologists.mockResolvedValue([
      { psyId: 9, name: 'Nuevo psicólogo', speciality: 'General', licenseNumber: 2 },
    ]);

    await service.assignAppointment(42, {
      psyId: 9,
      appDate: '2026-10-06T09:00:00.000Z',
      appDuration: 60,
    }, 3);

    expect(scheduleService.assignAppointmentSlot).toHaveBeenCalledWith({
      appId: 42,
      psychologistId: 9,
      secretaryUserId: 3,
      appDate: new Date('2026-10-06T09:00:00.000Z'),
      duration: 60,
    });
  });

  it('rejects assignment to an unavailable psychologist', async () => {
    const { service, repository, scheduleService } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'pendiente' });
    repository.findPsychologists.mockResolvedValue([]);

    await expect(
      service.assignAppointment(42, {
        psyId: 8,
        appDate: '2026-10-06T09:00:00.000Z',
        appDuration: 60,
      }, 3),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'PSYCHOLOGIST_NOT_AVAILABLE' }),
    });
    expect(scheduleService.assignAppointmentSlot).not.toHaveBeenCalled();
  });

  it('rejects an active psychologist when the selected slot is unavailable', async () => {
    const { service, repository, scheduleService } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'pendiente' });
    repository.findPsychologists.mockResolvedValue([
      { psyId: 8, name: 'Psicólogo activo', speciality: 'General', licenseNumber: 1 },
    ]);
    scheduleService.assignAppointmentSlot.mockResolvedValue('slot_taken');

    await expect(
      service.assignAppointment(42, {
        psyId: 8,
        appDate: '2026-10-06T09:00:00.000Z',
        appDuration: 60,
      }, 3),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'SCHEDULE_SLOT_TAKEN' }),
    });
    expect(scheduleService.assignAppointmentSlot).toHaveBeenCalled();
  });

  it('discards a request with a reason', async () => {
    const { service, repository } = setup();
    repository.findById
      .mockResolvedValueOnce({ appId: 42, appState: 'pendiente' })
      .mockResolvedValueOnce({ appId: 42, appState: 'descartada', appDiscardReason: 'Duplicada' });

    await expect(
      service.discardAppointment(42, { reason: 'Duplicada' }),
    ).resolves.toMatchObject({ appState: 'descartada' });
    expect(repository.discard).toHaveBeenCalledWith(42, 'Duplicada');
  });

  it('only confirms an assigned request', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'pendiente' });

    await expect(
      service.confirmAppointment(
        42,
        { psyId: 8, appDate: '2026-10-01T10:00:00.000Z' },
        3,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'APPOINTMENT_NOT_ASSIGNED' }),
    });
  });
});
