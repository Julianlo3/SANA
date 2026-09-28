import { describe, expect, it, vi } from 'vitest';
import { ClinicalNotesRepository } from '../../src/clinical-notes/clinical-notes.repository.js';

function setup() {
  const dataSource = {
    query: vi.fn(),
  };

  return {
    repository: new ClinicalNotesRepository(dataSource as never),
    dataSource,
  };
}

describe('ClinicalNotesRepository', () => {
  describe('create', () => {
    it('creates a clinical note successfully', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([{ cn_id: 42 }]);

      const result = await repository.create({
        appId: 1,
        psyId: 100,
        cnObservation: 'Test observation',
        cnTermsAccepted: true,
      });

      expect(result).toBe(42);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO clinical_notes'),
        [1, 100, 'Test observation', true],
      );
    });
  });

  describe('findById', () => {
    it('returns clinical note when found and psychologist matches', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([
        {
          cnId: 1,
          appId: 10,
          psyId: 100,
          cnObservation: 'Test',
          cnTermsAccepted: true,
          cnCreatedAt: new Date(),
        },
      ]);

      const result = await repository.findById(1, 100);

      expect(result).toMatchObject({
        cnId: 1,
        psyId: 100,
      });
    });

    it('returns null when psychologist does not match', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([]);

      const result = await repository.findById(1, 200);

      expect(result).toBeNull();
    });
  });

  describe('findByAppointment', () => {
    it('returns notes for appointment when psychologist matches', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([
        {
          cnId: 1,
          appId: 10,
          psyId: 100,
          cnObservation: 'Test',
          cnTermsAccepted: true,
          cnCreatedAt: new Date(),
        },
      ]);

      const result = await repository.findByAppointment(10, 100);

      expect(result).toHaveLength(1);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE app_id = $1 AND psy_id = $2'),
        [10, 100],
      );
    });
  });

  describe('findConsultantHistory', () => {
    it('returns consultant history for psychologist', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([
        {
          cnId: 1,
          appId: 10,
          appDate: new Date(),
          psychologistName: 'Dr. Test',
          cnObservation: 'Test',
          cnCreatedAt: new Date(),
        },
      ]);

      const result = await repository.findConsultantHistory(50, 100);

      expect(result).toHaveLength(1);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE a.req_id = $1 AND cn.psy_id = $2'),
        [50, 100],
      );
    });
  });

  describe('recordAudit', () => {
    it('records audit entry successfully', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue(undefined);

      await repository.recordAudit({
        cnId: 1,
        psyId: 100,
        ipAddress: '127.0.0.1',
      });

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO clinical_notes_audit'),
        [1, 100, '127.0.0.1'],
      );
    });
  });

  describe('findAuditHistory', () => {
    it('returns audit history for clinical note', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([
        {
          cnaId: 1,
          cnId: 1,
          psyId: 100,
          cnaDate: new Date(),
          cnaIpAddress: '127.0.0.1',
        },
      ]);

      const result = await repository.findAuditHistory(1, 100);

      expect(result).toHaveLength(1);
    });
  });

  describe('isAppointmentCompleted', () => {
    it('returns true when appointment is completed', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([{ app_state: 'realizada' }]);

      const result = await repository.isAppointmentCompleted(1);

      expect(result).toBe(true);
    });

    it('returns false when appointment is not completed', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([{ app_state: 'confirmada' }]);

      const result = await repository.isAppointmentCompleted(1);

      expect(result).toBe(false);
    });

    it('returns false when appointment does not exist', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([]);

      const result = await repository.isAppointmentCompleted(1);

      expect(result).toBe(false);
    });
  });

  describe('isTreatingPsychologist', () => {
    it('returns true when psychologist is treating professional', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([{ psy_id: 100 }]);

      const result = await repository.isTreatingPsychologist(1, 100);

      expect(result).toBe(true);
    });

    it('returns false when psychologist is not treating professional', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([{ psy_id: 200 }]);

      const result = await repository.isTreatingPsychologist(1, 100);

      expect(result).toBe(false);
    });
  });

  describe('getAppointmentDetails', () => {
    it('returns appointment details when found', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([
        {
          app_id: 1,
          app_state: 'realizada',
          psy_id: 100,
          req_id: 50,
        },
      ]);

      const result = await repository.getAppointmentDetails(1);

      expect(result).toMatchObject({
        appId: 1,
        appState: 'realizada',
        psyId: 100,
        reqId: 50,
      });
    });

    it('returns null when appointment not found', async () => {
      const { repository, dataSource } = setup();
      dataSource.query.mockResolvedValue([]);

      const result = await repository.getAppointmentDetails(1);

      expect(result).toBeNull();
    });
  });
});
