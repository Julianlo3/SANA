import { describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CarePackagesService } from '../../src/care-packages/care-packages.service.js';

function setup() {
  const queryMock = vi.fn();
  const transactionMock = vi.fn(async (callback: (m: any) => Promise<any>) => {
    return callback({ query: queryMock });
  });

  const db = {
    transaction: transactionMock,
    query: queryMock,
  };

  const schedule = {
    findAvailability: vi.fn(),
  };

  const service = new CarePackagesService(db as never, schedule as never);

  return { service, queryMock, schedule };
}

describe('CarePackagesService', () => {
  describe('findAll', () => {
    it('groups the patient identity fields selected by the package list query', async () => {
      const { service, queryMock } = setup();
      queryMock.mockResolvedValueOnce([]);

      await service.findAll();

      const [query] = queryMock.mock.calls[0];
      expect(query).toContain('dep.dep_id');
      expect(query).toContain('patient.per_id');
      expect(query).toMatch(
        /GROUP BY\s+cp\.cp_id,\s+psy\.per_name,\s+dep\.dep_name,\s+dep\.dep_id,\s+patient\.per_name,\s+patient\.per_id/,
      );
    });
  });

  describe('findMyPackages', () => {
    it('projects patientId and patientDependentId and filters dependents with EXISTS to avoid join fan-out', async () => {
      const { service, queryMock } = setup();
      queryMock.mockResolvedValueOnce([]);

      await service.findMyPackages(13);

      const [query, params] = queryMock.mock.calls[0];
      expect(params).toEqual([13]);
      expect(query).toContain('COALESCE(dep.dep_id, patient.per_id) AS "patientId"');
      expect(query).toContain('cp.cp_patient_dependent_id AS "patientDependentId"');
      expect(query).toContain('OR EXISTS (');
      expect(query).not.toContain('LEFT JOIN requester_dependent');
    });
  });

  describe('suggest', () => {
    it('throws NotFoundException when valuation appointment does not exist', async () => {
      const { service, queryMock } = setup();
      queryMock.mockResolvedValueOnce([]);

      await expect(
        service.suggest(
          { assessmentAppointmentId: 99, sessionLimit: 6, priority: 'alta' },
          10,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when psychologist is not the assigned psychologist', async () => {
      const { service, queryMock } = setup();
      queryMock.mockResolvedValueOnce([
        {
          app_id: 1,
          app_state: 'confirmada',
          app_kind: 'valoracion',
          psy_id: 20,
          app_patient_person_id: 100,
          app_patient_dependent_id: null,
        },
      ]);

      await expect(
        service.suggest(
          { assessmentAppointmentId: 1, sessionLimit: 6, priority: 'alta' },
          10,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when appointment is not a valuation', async () => {
      const { service, queryMock } = setup();
      queryMock.mockResolvedValueOnce([
        {
          app_id: 1,
          app_state: 'confirmada',
          app_kind: 'paquete',
          psy_id: 10,
          app_patient_person_id: 100,
          app_patient_dependent_id: null,
        },
      ]);

      await expect(
        service.suggest(
          { assessmentAppointmentId: 1, sessionLimit: 6, priority: 'alta' },
          10,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when valuation was already referred to another psychologist', async () => {
      const { service, queryMock } = setup();
      queryMock.mockResolvedValueOnce([
        {
          app_id: 1,
          app_state: 'realizada',
          app_kind: 'valoracion',
          psy_id: 10,
          app_patient_person_id: 100,
          app_patient_dependent_id: null,
          app_referred_to_psy_id: 25,
        },
      ]);

      await expect(
        service.suggest(
          { assessmentAppointmentId: 1, sessionLimit: 6, priority: 'alta' },
          10,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when package already exists for this valuation', async () => {
      const { service, queryMock } = setup();
      queryMock
        .mockResolvedValueOnce([
          {
            app_id: 1,
            app_state: 'realizada',
            app_kind: 'valoracion',
            psy_id: 10,
            app_patient_person_id: 100,
            app_patient_dependent_id: null,
          },
        ])
        .mockResolvedValueOnce([{ cp_id: 1 }]); // existing suggestion check

      await expect(
        service.suggest(
          { assessmentAppointmentId: 1, sessionLimit: 6, priority: 'alta' },
          10,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when patient already has an active package', async () => {
      const { service, queryMock } = setup();
      queryMock
        .mockResolvedValueOnce([
          {
            app_id: 1,
            app_state: 'realizada',
            app_kind: 'valoracion',
            psy_id: 10,
            app_patient_person_id: 100,
            app_patient_dependent_id: null,
          },
        ])
        .mockResolvedValueOnce([]) // existing package for valuation: none
        .mockResolvedValueOnce([{ cp_id: 5 }]); // active package for patient exists

      await expect(
        service.suggest(
          { assessmentAppointmentId: 1, sessionLimit: 6, priority: 'alta' },
          10,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when sessionLimit is less than 3 or greater than 12', async () => {
      const { service, queryMock } = setup();

      await expect(
        service.suggest(
          { assessmentAppointmentId: 1, sessionLimit: 2, priority: 'alta' },
          10,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.suggest(
          { assessmentAppointmentId: 1, sessionLimit: 13, priority: 'alta' },
          10,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(queryMock).not.toHaveBeenCalled();
    });

    it('successfully creates suggestion with state sugerido and marks valuation as realizada', async () => {
      const { service, queryMock } = setup();
      queryMock
        .mockResolvedValueOnce([
          {
            app_id: 1,
            app_state: 'confirmada',
            app_kind: 'valoracion',
            psy_id: 10,
            app_patient_person_id: 100,
            app_patient_dependent_id: null,
          },
        ])
        .mockResolvedValueOnce([]) // update appointment to realizada
        .mockResolvedValueOnce([]) // existing suggestion for assessment: none
        .mockResolvedValueOnce([]) // active package for patient: none
        .mockResolvedValueOnce([
          {
            id: 1,
            state: 'sugerido',
            sessionLimit: 6,
            priority: 'alta',
            psychologistId: 10,
            suggestionComment: 'Requiere seguimiento',
            createdAt: new Date(),
          },
        ]);

      const result = await service.suggest(
        {
          assessmentAppointmentId: 1,
          sessionLimit: 6,
          priority: 'alta',
          comment: 'Requiere seguimiento',
        },
        10,
      );

      expect(result.id).toBe(1);
      expect(result.state).toBe('sugerido');
      expect(result.sessionLimit).toBe(6);
    });
  });

  describe('approve', () => {
    it('throws NotFoundException when package does not exist', async () => {
      const { service, queryMock } = setup();
      queryMock.mockResolvedValueOnce([]);

      await expect(service.approve(99, {}, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when package is not in state sugerido', async () => {
      const { service, queryMock } = setup();
      queryMock.mockResolvedValueOnce([{ cp_id: 1, cp_state: 'activo' }]);

      await expect(service.approve(1, {}, 1)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when resulting sessionLimit is outside 3..12', async () => {
      const { service, queryMock } = setup();
      queryMock
        .mockResolvedValueOnce([
          {
            cp_id: 1,
            cp_state: 'sugerido',
            cp_patient_person_id: 100,
            cp_patient_dependent_id: null,
            cp_session_limit: 4,
            cp_priority: 'media',
          },
        ])
        .mockResolvedValueOnce([]); // active package check: none

      await expect(
        service.approve(1, { sessionLimit: 2 }, 50),
      ).rejects.toThrow(BadRequestException);

      queryMock
        .mockResolvedValueOnce([
          {
            cp_id: 1,
            cp_state: 'sugerido',
            cp_patient_person_id: 100,
            cp_patient_dependent_id: null,
            cp_session_limit: 4,
            cp_priority: 'media',
          },
        ])
        .mockResolvedValueOnce([]); // active package check: none

      await expect(
        service.approve(1, { sessionLimit: 13 }, 50),
      ).rejects.toThrow(BadRequestException);
    });

    it('approves package and updates to activo with secretary id', async () => {
      const { service, queryMock } = setup();
      queryMock
        .mockResolvedValueOnce([
          {
            cp_id: 1,
            cp_state: 'sugerido',
            cp_patient_person_id: 100,
            cp_patient_dependent_id: null,
            cp_session_limit: 4,
            cp_priority: 'media',
          },
        ])
        .mockResolvedValueOnce([]) // active package check: none
        .mockResolvedValueOnce([]) // update package
        .mockResolvedValueOnce([
          {
            id: 1,
            state: 'activo',
            sessionLimit: 6,
            priority: 'alta',
          },
        ]); // find(id)

      const res = await service.approve(1, { sessionLimit: 6, priority: 'alta' }, 50);
      expect(res.state).toBe('activo');
      expect(res.sessionLimit).toBe(6);
    });
  });

  describe('create', () => {
    it('throws BadRequestException when sessionLimit is less than 3 or greater than 12', async () => {
      const { service, queryMock } = setup();

      await expect(
        service.create(
          { assessmentAppointmentId: 1, sessionLimit: 2, priority: 'media' },
          50,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(
          { assessmentAppointmentId: 1, sessionLimit: 13, priority: 'media' },
          50,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(queryMock).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('rejects a suggested package with mandatory reason', async () => {
      const { service, queryMock } = setup();
      queryMock
        .mockResolvedValueOnce([{ cp_id: 1, cp_state: 'sugerido' }])
        .mockResolvedValueOnce([]) // update
        .mockResolvedValueOnce([
          { id: 1, state: 'rechazado', rejectionReason: 'No apto' },
        ]);

      const res = await service.reject(1, { reason: 'No apto' }, 50);
      expect(res.state).toBe('rechazado');
    });
  });

  describe('scheduleAppointment', () => {
    it('rejects scheduling when the package has no slots remaining', async () => {
      const { service, queryMock } = setup();
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      queryMock
        .mockResolvedValueOnce([
          {
            cp_id: 1,
            cp_state: 'activo',
            cp_session_limit: 4,
            psy_id: 10,
            req_id: 42,
          },
        ])
        .mockResolvedValueOnce([{ count: 4 }]); // 4 used out of 4 limit

      await expect(
        service.scheduleAppointment(
          1,
          { appDate: futureDate },
          { requesterId: 42 },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('follow-up valuation after finalized care package', () => {
    it('rejects follow-up valuation availability when package is still active', async () => {
      const { service, queryMock, schedule } = setup();
      queryMock
        .mockResolvedValueOnce([
          {
            id: 1,
            state: 'activo',
            psychologistId: 10,
            patientPersonId: 42,
            patientDependentId: null,
          },
        ])
        .mockResolvedValueOnce([{ '?column?': 1 }]); // allowed requester check

      await expect(
        service.followUpValuationAvailability(1, 42, {
          appointmentStart: '2026-12-01T08:00:00Z',
          duration: 60,
          delayHours: 24,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ error: 'ACTIVE_CARE_PACKAGE_EXISTS' }),
      });
      expect(schedule.findAvailability).not.toHaveBeenCalled();
    });

    it('returns availability strictly for the treating psychologist of the finalized package', async () => {
      const { service, queryMock, schedule } = setup();
      queryMock
        .mockResolvedValueOnce([
          {
            id: 1,
            state: 'finalizado',
            psychologistId: 10,
            patientPersonId: 42,
            patientDependentId: null,
          },
        ])
        .mockResolvedValueOnce([{ '?column?': 1 }]) // allowed requester check
        .mockResolvedValueOnce([]) // no active or suggested packages
        .mockResolvedValueOnce([]) // no newer finalized package
        .mockResolvedValueOnce([]); // no open valuation in progress

      schedule.findAvailability.mockResolvedValue([
        { date: '2026-12-02', startTime: '09:00:00', endTime: '10:00:00', psychologists: [] },
      ]);

      const slots = await service.followUpValuationAvailability(1, 42, {
        appointmentStart: '2026-12-01T08:00:00Z',
        duration: 60,
        delayHours: 24,
      });

      expect(slots).toHaveLength(1);
      expect(schedule.findAvailability).toHaveBeenCalledWith({
        appointmentStart: '2026-12-01T08:00:00Z',
        duration: 60,
        delayHours: 24,
        psychologistIds: '10',
      });
    });

    it('rejects scheduling a follow-up valuation if patient has an active package', async () => {
      const { service, queryMock } = setup();
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      queryMock.mockResolvedValueOnce([
        {
          cp_id: 1,
          cp_state: 'activo',
          psy_id: 10,
          req_id: 42,
          cp_patient_person_id: 42,
          cp_patient_dependent_id: null,
          app_type: 'virtual',
        },
      ]);

      await expect(
        service.scheduleFollowUpValuation(1, { appDate: futureDate }, 42),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ error: 'ACTIVE_CARE_PACKAGE_EXISTS' }),
      });
    });

    it('schedules a new confirmed valuation appointment strictly with the treating psychologist when package is finalized', async () => {
      const { service, queryMock } = setup();
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      queryMock
        .mockResolvedValueOnce([
          {
            cp_id: 1,
            cp_state: 'finalizado',
            psy_id: 10,
            req_id: 42,
            cp_patient_person_id: 42,
            cp_patient_dependent_id: null,
            app_type: 'virtual',
          },
        ])
        .mockResolvedValueOnce([]) // no active or suggested packages
        .mockResolvedValueOnce([]) // no newer finalized package
        .mockResolvedValueOnce([]) // no open valuation in progress
        .mockResolvedValueOnce([{ psy_id: 10 }]) // active psychologist check
        .mockResolvedValueOnce([]) // pg_advisory_xact_lock
        .mockResolvedValueOnce([{ '?column?': 1 }]) // free slot check
        .mockResolvedValueOnce([
          {
            appId: 99,
            appDate: futureDate,
            appState: 'confirmada',
            appKind: 'valoracion',
            appType: 'presencial',
            psychologistId: 10,
            carePackageId: null,
          },
        ])
        .mockResolvedValueOnce([]); // schedule_occupancy insert

      const created = await service.scheduleFollowUpValuation(
        1,
        {
          appDate: futureDate,
          appType: 'presencial',
          appReason: 'Solicitud de nuevo ciclo terapéutico',
        },
        42,
      );

      expect(created).toMatchObject({
        appId: 99,
        appState: 'confirmada',
        appKind: 'valoracion',
        appType: 'presencial',
        psychologistId: 10,
        carePackageId: null,
      });
    });
  });
});

