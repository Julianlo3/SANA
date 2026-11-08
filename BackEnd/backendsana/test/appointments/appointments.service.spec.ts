import { BadRequestException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { AppointmentsService } from '../../src/appointments/appointments.service.js';
import { RequesterIdentityConflictError } from '../../src/appointments/appointments.repository.js';

function baseRequest(overrides: Record<string, unknown> = {}) {
  return {
    requesterName: 'Ana Solicitante',
    requesterCardType: 'CC',
    requesterIdentityDocument: '10212265698',
    requesterContactNumber: '3001234567',
    requesterEmail: 'ana@example.com',
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
    findPsychologistEmail: vi.fn().mockResolvedValue(null),
    discard: vi.fn(),
    cancelByRequester: vi.fn().mockResolvedValue(true),
    discardByRequester: vi.fn().mockResolvedValue(true),
    confirm: vi.fn(),
    updateState: vi.fn().mockResolvedValue(true),
    recordAssignmentHistory: vi.fn().mockResolvedValue(undefined),
    selectSlotForRequester: vi.fn().mockResolvedValue('assigned'),
  };
  const scheduleService = {
    confirmAppointmentSlot: vi.fn().mockResolvedValue(true),
    assignAppointmentSlot: vi.fn().mockResolvedValue('assigned'),
    checkPsychologistAvailability: vi.fn().mockResolvedValue(true),
    findPublicAvailability: vi.fn().mockResolvedValue([]),
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
    expect(emailService.enqueueEmail).toHaveBeenCalledOnce();
    expect(emailService.enqueueEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ana@example.com',
      subject: 'Recibimos tu solicitud de cita #42',
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

  it('confirms a first appointment immediately when a public slot is selected', async () => {
    const { service, repository, emailService } = setup();
    repository.findById.mockResolvedValue({
      appId: 42,
      appDate: '2026-12-10T15:00:00.000Z',
      requesterName: 'Ana Solicitante',
      requesterEmail: 'ana@example.com',
      patientName: 'Ana Solicitante',
      psychologistName: 'Psicóloga',
      appType: 'virtual',
    });

    await expect(
      service.requestAppointment(
        baseRequest({ appDate: '2026-12-10T15:00:00.000Z' }) as never,
      ),
    ).resolves.toMatchObject({
      appId: 42,
      message: 'Tu primera cita quedó asignada y confirmada con éxito.',
    });

    expect(repository.createRequest).toHaveBeenCalledWith(expect.objectContaining({
      slot: { appDate: new Date('2026-12-10T15:00:00.000Z'), duration: 60 },
    }));
    expect(emailService.enqueueEmail).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Confirmación de tu cita psicológica - Fundación Dejando Huellas Felices',
    }));
  });

  it('returns the same generic conflict for duplicate requester email or document', async () => {
    const expectedResponse = {
      error: 'REQUESTER_ALREADY_REGISTERED',
      message: 'No se pudo asociar la solicitud con esos datos. Verifique el correo y documento, o inicie sesión si ya tiene una cuenta.',
    };

    for (const constraint of ['Person_email_uq', 'Person_idocument_uq']) {
      const { service, repository } = setup();
      repository.createRequest.mockRejectedValue(
        new QueryFailedError('INSERT INTO person', [], {
          ...Object.assign(new Error('duplicate requester'), {
            code: '23505',
            constraint,
          }),
        }),
      );

      await expect(
        service.requestAppointment(baseRequest() as never),
      ).rejects.toMatchObject({
        response: expectedResponse,
        status: 409,
      });
    }
  });

  it('returns a registration conflict when email and identity document resolve to different people', async () => {
    const { service, repository } = setup();
    repository.createRequest.mockRejectedValue(
      new RequesterIdentityConflictError(),
    );

    await expect(
      service.requestAppointment(baseRequest() as never),
    ).rejects.toMatchObject({
      response: {
        error: 'REQUESTER_ALREADY_REGISTERED',
      },
      status: 409,
    });
  });

  it('passes the authenticated person ID to associate a request with the signed-in account', async () => {
    const { service, repository } = setup();
    const authenticatedUser = {
      userId: 10,
      personId: 10,
      email: 'employee@example.com',
      name: 'Empleado',
      roles: ['secretario'],
      auth0Subject: 'auth0|employee',
      state: 'activo',
      termsAccepted: true,
    };

    await service.requestAppointment(
      baseRequest() as never,
      authenticatedUser,
    );

    expect(repository.createRequest).toHaveBeenCalledWith(
      expect.objectContaining({ authenticatedPersonId: 10 }),
    );
  });

  it('does not translate unrelated database errors into requester conflicts', async () => {
    const { service, repository } = setup();
    const databaseError = new QueryFailedError('INSERT INTO person', [], {
      ...Object.assign(new Error('duplicate unrelated value'), {
        code: '23505',
        constraint: 'Some_other_unique_constraint',
      }),
    });
    repository.createRequest.mockRejectedValue(databaseError);

    await expect(
      service.requestAppointment(baseRequest() as never),
    ).rejects.toBe(databaseError);
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

  it('rejects the request when the requester did not accept the data treatment', async () => {
    const { service, repository } = setup();

    await expect(
      service.requestAppointment(
        baseRequest({ requesterTermsAccepted: false }) as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'TERMS_NOT_ACCEPTED' }),
    });
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('records the acceptance with the request IP and the web channel', async () => {
    const { service, repository } = setup();

    await service.requestAppointment(baseRequest() as never, undefined, '203.0.113.7');

    expect(repository.createRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptance: { ipAddress: '203.0.113.7', channel: 'web' },
      }),
    );
  });

  it('accepts an explicit web channel from an anonymous requester', async () => {
    const { service, repository } = setup();

    await service.requestAppointment(baseRequest({ channel: 'web' }) as never);

    expect(repository.createRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptance: { ipAddress: null, channel: 'web' },
      }),
    );
  });

  it.each([
    ['an anonymous requester', undefined],
    ['a consultant', ['consultante']],
    ['a psychologist', ['psicologo']],
  ])('forbids an assisted channel sent by %s', async (_label, roles) => {
    const { service, repository } = setup();
    const authenticatedUser = roles
      ? {
        userId: 11,
        personId: 11,
        email: 'user@example.com',
        name: 'Usuario',
        roles,
        auth0Subject: 'auth0|user',
        state: 'activo',
        termsAccepted: true,
      }
      : undefined;

    await expect(
      service.requestAppointment(
        baseRequest({ channel: 'telefono' }) as never,
        authenticatedUser as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'CHANNEL_NOT_ALLOWED' }),
    });
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('lets a secretary send an assisted channel without recording another person as accepting', async () => {
    const { service, repository } = setup();
    const secretary = {
      userId: 10,
      personId: 10,
      email: 'secretaria@example.com',
      name: 'Secretaria',
      roles: ['secretario'],
      auth0Subject: 'auth0|secretary',
      state: 'activo',
      termsAccepted: true,
    };

    await service.requestAppointment(
      baseRequest({ channel: 'whatsapp' }) as never,
      secretary,
      '198.51.100.4',
    );

    expect(repository.createRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        authenticatedPersonId: 10,
        acceptance: { ipAddress: '198.51.100.4', channel: 'web' },
      }),
    );
  });

  it('passes trimmed vulnerabilities for a self request', async () => {
    const { service, repository } = setup();

    await service.requestAppointment(
      baseRequest({ vulnerabilities: ['  Población migrante  ', 'Adulto mayor'] }) as never,
    );

    expect(repository.createRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requester: expect.objectContaining({
          vulnerabilities: ['Población migrante', 'Adulto mayor'],
        }),
      }),
    );
  });

  it('rejects blank vulnerabilities with the same rule as the profile', async () => {
    const { service, repository } = setup();

    await expect(
      service.requestAppointment(
        baseRequest({ vulnerabilities: ['   '] }) as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'INVALID_VULNERABILITY' }),
    });
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('rejects vulnerabilities on a request for a dependent', async () => {
    const { service, repository } = setup();

    await expect(
      service.requestAppointment(
        baseRequest({
          patientType: 'dependent',
          dependentName: 'Menor a cargo',
          dependentIdentityDocument: '87654321',
          dependentBirthdate: '2015-01-01',
          relationshipId: 1,
          dependentTermsAccepted: true,
          vulnerabilities: ['Población migrante'],
        }) as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        error: 'VULNERABILITIES_NOT_ALLOWED_FOR_DEPENDENT',
      }),
    });
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('does not send vulnerabilities when the requester omits them', async () => {
    const { service, repository } = setup();

    await service.requestAppointment(baseRequest() as never);

    expect(repository.createRequest.mock.calls[0][0].requester.vulnerabilities).toBeUndefined();
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

describe('AppointmentsService.cancelOwnAppointment', () => {
  it('cancels the authenticated requester’s confirmed appointment and notifies participants', async () => {
    const { service, repository, emailService } = setup();
    repository.findById
      .mockResolvedValueOnce({
        appId: 42,
        appState: 'confirmada',
        requesterId: 7,
        requesterEmail: 'requester@example.com',
        psychologistId: 8,
        psychologistName: 'Psicóloga',
        patientName: 'Paciente',
        appDate: '2026-10-20T10:00:00.000Z',
        appType: 'virtual',
      })
      .mockResolvedValueOnce({
        appId: 42,
        appState: 'cancelada',
        requesterId: 7,
        requesterEmail: 'requester@example.com',
        psychologistId: 8,
        psychologistName: 'Psicóloga',
        patientName: 'Paciente',
        appDate: '2026-10-20T10:00:00.000Z',
        appType: 'virtual',
      });
    repository.findPsychologistEmail.mockResolvedValue('psychologist@example.com');

    await expect(service.cancelOwnAppointment(42, 7)).resolves.toMatchObject({
      appId: 42,
      appState: 'cancelada',
    });
    expect(repository.cancelByRequester).toHaveBeenCalledWith(42, 7);
    expect(emailService.enqueueEmail).toHaveBeenCalledTimes(2);
  });

  it('forbids cancelling another requester’s appointment', async () => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue({
      appId: 42,
      appState: 'confirmada',
      requesterId: 9,
    });

    await expect(service.cancelOwnAppointment(42, 7)).rejects.toMatchObject({
      response: expect.objectContaining({
        error: 'APPOINTMENT_NOT_REQUESTED_BY_USER',
      }),
    });
    expect(repository.cancelByRequester).not.toHaveBeenCalled();
  });

  it.each(['pendiente', 'asignada'])(
    'withdraws the requester’s unconfirmed appointment in the %s state',
    async (appState) => {
      const { service, repository, emailService } = setup();
      repository.findById
        .mockResolvedValueOnce({
          appId: 42,
          appState,
          requesterId: 7,
        })
        .mockResolvedValueOnce({
          appId: 42,
          appState: 'descartada',
          requesterId: 7,
        });

      await expect(service.cancelOwnAppointment(42, 7)).resolves.toMatchObject({
        appId: 42,
        appState: 'descartada',
      });
      expect(repository.discardByRequester).toHaveBeenCalledWith(42, 7);
      expect(repository.cancelByRequester).not.toHaveBeenCalled();
      expect(emailService.enqueueEmail).not.toHaveBeenCalled();
    },
  );

  it.each(['cancelada', 'realizada', 'descartada'])(
    'does not cancel an appointment in the %s state',
    async (appState) => {
      const { service, repository } = setup();
      repository.findById.mockResolvedValue({
        appId: 42,
        appState,
        requesterId: 7,
      });

      await expect(service.cancelOwnAppointment(42, 7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.discardByRequester).not.toHaveBeenCalled();
      expect(repository.cancelByRequester).not.toHaveBeenCalled();
    },
  );

  it.each([
    { appState: 'pendiente', transition: 'discardByRequester' },
    { appState: 'confirmada', transition: 'cancelByRequester' },
  ])('returns a conflict if a $appState appointment changes state concurrently', async ({
    appState,
  }) => {
    const { service, repository } = setup();
    repository.findById.mockResolvedValue({
      appId: 42,
      appState,
      requesterId: 7,
    });
    const transition = appState === 'pendiente'
      ? repository.discardByRequester
      : repository.cancelByRequester;
    transition.mockResolvedValue(false);

    await expect(service.cancelOwnAppointment(42, 7)).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'APPOINTMENT_STATE_CHANGED' }),
    });
  });

  describe('Consultant Availability and Slot Selection', () => {
    it('rejects an appointment request with a past appDate', async () => {
      const { service, repository } = setup();

      await expect(
        service.requestAppointment(
          baseRequest({ appDate: '2020-01-01T10:00:00.000Z' }) as never,
        ),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ error: 'INVALID_APPOINTMENT_DATE' }),
      });
      expect(repository.createRequest).not.toHaveBeenCalled();
    });

    it('creates request and reserves slot when future appDate is supplied', async () => {
      const { service, repository } = setup();
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      const result = await service.requestAppointment(
        baseRequest({ appDate: futureDate }) as never,
      );

      expect(result).toEqual({
        appId: 42,
        message: 'Tu primera cita quedó asignada y confirmada con éxito.',
      });
      expect(repository.createRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          slot: {
            appDate: new Date(futureDate),
            duration: 60,
          },
        }),
      );
    });

    it('delegates public availability search to scheduleService', async () => {
      const { service, scheduleService } = setup();
      const mockSlots = [{ date: '2026-12-01', startTime: '08:00:00', endTime: '09:00:00' }];
      scheduleService.findPublicAvailability.mockResolvedValue(mockSlots);

      const result = await service.findPublicAvailability({
        appointmentStart: '2026-12-01T08:00:00.000Z',
        duration: 60,
        delayHours: 24,
      });

      expect(result).toEqual(mockSlots);
      expect(scheduleService.findPublicAvailability).toHaveBeenCalledWith({
        appointmentStart: '2026-12-01T08:00:00.000Z',
        duration: 60,
        delayHours: 24,
      });
    });

    it('allows an authenticated consultant to select a slot for their pending appointment', async () => {
      const { service, repository } = setup();
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      repository.selectSlotForRequester.mockResolvedValue('assigned');

      const result = await service.selectSlotForOwnAppointment(10, 7, futureDate);

      expect(result).toEqual({
        appId: 10,
        message: 'Horario reservado con éxito.',
        appDate: futureDate,
      });
      expect(repository.selectSlotForRequester).toHaveBeenCalledWith({
        appId: 10,
        requesterId: 7,
        appDate: new Date(futureDate),
        duration: 60,
      });
    });

    it('throws ConflictException when chosen slot is taken', async () => {
      const { service, repository } = setup();
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      repository.selectSlotForRequester.mockResolvedValue('slot_taken');

      await expect(
        service.selectSlotForOwnAppointment(10, 7, futureDate),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ error: 'SCHEDULE_SLOT_TAKEN' }),
      });
    });
  });
});
