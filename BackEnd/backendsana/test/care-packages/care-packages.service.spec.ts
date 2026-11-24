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
});

