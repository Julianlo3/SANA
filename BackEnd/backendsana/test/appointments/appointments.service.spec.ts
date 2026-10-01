import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AppointmentsService } from '../../src/appointments/appointments.service.js';

function baseRequest(overrides: Record<string, unknown> = {}) {
  return {
    requesterName: 'Ana Solicitante',
    requesterCardType: 'CC',
    requesterIdentityDocument: '10212265698',
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
    findActiveSecretaryEmails: vi.fn().mockResolvedValue([
      'secretary.one@example.com',
      'secretary.two@example.com',
    ]),
    findPsychologistEmail: vi.fn().mockResolvedValue(null),
    discard: vi.fn(),
    confirm: vi.fn(),
    updateState: vi.fn().mockResolvedValue(true),
    recordAssignmentHistory: vi.fn().mockResolvedValue(undefined),
  };
  const scheduleService = {
    confirmAppointmentSlot: vi.fn().mockResolvedValue(true),
    assignAppointmentSlot: vi.fn().mockResolvedValue('assigned'),
    checkPsychologistAvailability: vi.fn().mockResolvedValue(true),
  };
  const emailService = { enqueueEmail: vi.fn().mockResolvedValue(undefined) };
  return {
    service: new AppointmentsService(
      repository as never,
      scheduleService as never,
      emailService as never,
    ),
    repository,
    scheduleService,
    emailService,
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
    const { service, repository, emailService } = setup();

    await expect(
      service.requestAppointment(baseRequest({ appReason: 'Motivo reservado' }) as never),
    ).resolves.toMatchObject({ appId: 42 });
    expect(repository.createRequest).toHaveBeenCalledOnce();
    expect(repository.createRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requester: expect.objectContaining({ identityDocument: '10212265698' }),
      }),
    );
    expect(repository.relationshipExists).not.toHaveBeenCalled();
    expect(repository.findActiveSecretaryEmails).toHaveBeenCalledOnce();
    expect(emailService.enqueueEmail).toHaveBeenCalledTimes(2);
    expect(emailService.enqueueEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'secretary.one@example.com',
      subject: 'Nueva solicitud de cita #42',
    }));
    expect(emailService.enqueueEmail.mock.calls[0][0].text).not.toContain('Motivo reservado');
  });

  it('ignores the legacy ideal-date field instead of persisting it', async () => {
    const { service, repository } = setup();

    await service.requestAppointment(
      baseRequest({ appDateIdeal: '2026-10-10T15:00:00.000Z' }) as never,
    );

    const persistedRequest = repository.createRequest.mock.calls[0][0];
    expect(persistedRequest).not.toHaveProperty('appDateIdeal');
  });

  it('keeps the request successful if secretary recipients cannot be loaded', async () => {
    const { service, repository, emailService } = setup();
    repository.findActiveSecretaryEmails.mockRejectedValue(new Error('database unavailable'));

    await expect(
      service.requestAppointment(baseRequest() as never),
    ).resolves.toMatchObject({ appId: 42 });
    expect(emailService.enqueueEmail).not.toHaveBeenCalled();
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
      .mockResolvedValueOnce({ appId: 42, appState: 'pendiente', requesterId: 10 })
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
    expect(repository.recordAssignmentHistory).toHaveBeenCalledWith({
      appId: 42,
      oldPsyId: null,
      newPsyId: 8,
      secId: 3,
      reason: null,
    });
  });

  it('allows reassignment of an already assigned request', async () => {
    const { service, repository, scheduleService } = setup();
    repository.findById
      .mockResolvedValueOnce({ appId: 42, appState: 'asignada', psychologistId: 8, requesterId: 10 })
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
    expect(repository.recordAssignmentHistory).toHaveBeenCalledWith({
      appId: 42,
      oldPsyId: 8,
      newPsyId: 9,
      secId: 3,
      reason: null,
    });
  });

  it('rejects assignment to an unavailable psychologist', async () => {
    const { service, repository, scheduleService } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'pendiente', requesterId: 10 });
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
    repository.findById.mockResolvedValue({ appId: 42, appState: 'pendiente', requesterId: 10 });
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
      .mockResolvedValueOnce({ appId: 42, appState: 'pendiente', requesterId: 10 })
      .mockResolvedValueOnce({ appId: 42, appState: 'descartada', appDiscardReason: 'Duplicada' });

    await expect(
      service.discardAppointment(42, { reason: 'Duplicada' }, 3),
    ).resolves.toMatchObject({ appState: 'descartada' });
    expect(repository.discard).toHaveBeenCalledWith(42, 'Duplicada');
  });

  it('confirms a pending request with a psychologist and slot in one action', async () => {
    const { service, repository, scheduleService, emailService } = setup();
    repository.findById
      .mockResolvedValueOnce({ appId: 42, appState: 'pendiente', requesterId: 10 })
      .mockResolvedValueOnce({
        appId: 42,
        appState: 'confirmada',
        requesterId: 10,
        psychologistId: 8,
        requesterName: 'Consultante',
        patientName: 'Paciente',
        requesterEmail: 'patient@example.com',
        appDate: '2026-10-01T10:00:00.000Z',
        appType: 'virtual',
        psychologistName: 'Psicóloga',
      });
    repository.findPsychologists.mockResolvedValue([
      { psyId: 8, name: 'Psicóloga', speciality: 'Infantil', licenseNumber: 1 },
    ]);
    repository.findPsychologistEmail.mockResolvedValue('psychologist@example.com');

    await expect(
      service.confirmAppointment(
        42,
        { psyId: 8, appDate: '2026-10-01T10:00:00.000Z', appDuration: 60 },
        3,
      ),
    ).resolves.toMatchObject({ appState: 'confirmada', psychologistId: 8 });
    expect(scheduleService.confirmAppointmentSlot).toHaveBeenCalledWith({
      appId: 42,
      secretaryUserId: 3,
      psyId: 8,
      appDate: new Date('2026-10-01T10:00:00.000Z'),
      appDuration: 60,
    });
    expect(repository.recordAssignmentHistory).toHaveBeenCalledWith({
      appId: 42,
      oldPsyId: null,
      newPsyId: 8,
      secId: 3,
      reason: null,
    });
    expect(emailService.enqueueEmail).toHaveBeenCalledTimes(2);
    expect(emailService.enqueueEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'patient@example.com',
    }));
    expect(emailService.enqueueEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'psychologist@example.com',
    }));
  });

  it('rejects confirmation when the selected slot is no longer available', async () => {
    const { service, repository, scheduleService } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'pendiente', requesterId: 10 });
    repository.findPsychologists.mockResolvedValue([
      { psyId: 8, name: 'Psicóloga', speciality: 'Infantil', licenseNumber: 1 },
    ]);
    scheduleService.confirmAppointmentSlot.mockResolvedValue(false);

    await expect(
      service.confirmAppointment(
        42,
        { psyId: 8, appDate: '2026-10-01T10:00:00.000Z', appDuration: 60 },
        3,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'SCHEDULE_SLOT_TAKEN' }),
    });
    expect(repository.recordAssignmentHistory).not.toHaveBeenCalled();
  });

  it('prevents assigning an inactive psychologist during confirmation', async () => {
    const { service, repository, scheduleService } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'pendiente', requesterId: 10 });
    repository.findPsychologists.mockResolvedValue([]);

    await expect(
      service.confirmAppointment(
        42,
        { psyId: 8, appDate: '2026-10-01T10:00:00.000Z', appDuration: 60 },
        3,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'PSYCHOLOGIST_NOT_AVAILABLE' }),
    });
    expect(scheduleService.confirmAppointmentSlot).not.toHaveBeenCalled();
  });

  it('prevents secretary from managing their own appointment during assignment', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'pendiente', requesterId: 3 });

    await expect(
      service.assignAppointment(42, {
        psyId: 8,
        appDate: '2026-10-06T09:00:00.000Z',
        appDuration: 60,
      }, 3),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'SECRETARY_CANNOT_MANAGE_OWN_APPOINTMENT' }),
    });
  });

  it('prevents psychologist from being assigned to their own appointment', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'pendiente', requesterId: 8 });
    repository.findPsychologists.mockResolvedValue([
      { psyId: 8, name: 'Psicólogo', speciality: 'General', licenseNumber: 1 },
    ]);

    await expect(
      service.assignAppointment(42, {
        psyId: 8,
        appDate: '2026-10-06T09:00:00.000Z',
        appDuration: 60,
      }, 3),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'PSYCHOLOGIST_CANNOT_ATTEND_OWN_APPOINTMENT' }),
    });
  });

  it('prevents secretary from managing their own appointment during confirmation', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'asignada', requesterId: 3, psychologistId: 8 });

    await expect(
      service.confirmAppointment(
        42,
        { psyId: 8, appDate: '2026-10-01T10:00:00.000Z', appDuration: 60 },
        3,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'SECRETARY_CANNOT_MANAGE_OWN_APPOINTMENT' }),
    });
  });

  it('prevents secretary from managing their own appointment during discard', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'pendiente', requesterId: 3 });

    await expect(
      service.discardAppointment(42, { reason: 'Duplicada' }, 3),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'SECRETARY_CANNOT_MANAGE_OWN_APPOINTMENT' }),
    });
  });

  it('prevents secretary from managing their own appointment during status update', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'asignada', requesterId: 3 });

    await expect(
      service.updateStatus(42, { state: 'cancelada' }, 3),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'SECRETARY_CANNOT_MANAGE_OWN_APPOINTMENT' }),
    });
  });

  it('allows the secretary to cancel only a confirmed appointment', async () => {
    const { service, repository } = setup();
    repository.findById
      .mockResolvedValueOnce({ appId: 42, appState: 'confirmada', requesterId: 10 })
      .mockResolvedValueOnce({ appId: 42, appState: 'cancelada', requesterId: 10 });

    await expect(
      service.updateStatus(42, { state: 'cancelada' }, 3),
    ).resolves.toMatchObject({ appState: 'cancelada' });
    expect(repository.updateState).toHaveBeenCalledWith(42, 'cancelada');
  });

  it('does not allow cancelling a pending or provisionally assigned request', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'asignada', requesterId: 10 });

    await expect(
      service.updateStatus(42, { state: 'cancelada' }, 3),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'APPOINTMENT_NOT_CONFIRMED' }),
    });
    expect(repository.updateState).not.toHaveBeenCalled();
  });

  it('does not allow the secretary status endpoint to mark a visit as completed', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue({ appId: 42, appState: 'confirmada', requesterId: 10 });

    await expect(
      service.updateStatus(42, { state: 'realizada' } as never, 3),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'INVALID_APPOINTMENT_STATUS_TRANSITION' }),
    });
    expect(repository.updateState).not.toHaveBeenCalled();
  });
});
