import { describe, expect, it, vi } from 'vitest';
import { ClinicalNotesController } from '../../src/clinical-notes/clinical-notes.controller.js';

function setup() {
  const service = {
    registerAttention: vi.fn(),
    findById: vi.fn(),
    findByAppointment: vi.fn(),
    findConsultantHistory: vi.fn(),
    findAuditHistory: vi.fn(),
  };

  return {
    controller: new ClinicalNotesController(service as never),
    service,
  };
}

describe('ClinicalNotesController', () => {
  describe('registerAttention', () => {
    it('calls service with correct parameters', async () => {
      const { controller, service } = setup();
      service.registerAttention.mockResolvedValue({
        cnId: 1,
        appId: 10,
        psyId: 100,
        cnObservation: 'Test',
        cnTermsAccepted: true,
        cnCreatedAt: new Date(),
      });

      await expect(
        controller.registerAttention(
          { user: { userId: 100 } } as never,
          { appId: 10, termsAccepted: true, observation: 'Test' },
        ),
      ).resolves.toMatchObject({ cnId: 1 });

      expect(service.registerAttention).toHaveBeenCalledWith(
        { appId: 10, termsAccepted: true, observation: 'Test' },
        100,
        expect.any(Object),
      );
    });
  });

  describe('findOne', () => {
    it('calls service with correct parameters', async () => {
      const { controller, service } = setup();
      service.findById.mockResolvedValue({
        cnId: 1,
        appId: 10,
        psyId: 100,
        cnObservation: 'Test',
        cnTermsAccepted: true,
        cnCreatedAt: new Date(),
      });

      await expect(
        controller.findOne({ user: { userId: 100 } } as never, 1),
      ).resolves.toMatchObject({ cnId: 1 });

      expect(service.findById).toHaveBeenCalledWith(1, 100);
    });
  });

  describe('findByAppointment', () => {
    it('calls service with correct parameters', async () => {
      const { controller, service } = setup();
      service.findByAppointment.mockResolvedValue([
        {
          cnId: 1,
          appId: 10,
          psyId: 100,
          cnObservation: 'Test',
          cnTermsAccepted: true,
          cnCreatedAt: new Date(),
        },
      ]);

      await expect(
        controller.findByAppointment({ user: { userId: 100 } } as never, 10),
      ).resolves.toHaveLength(1);

      expect(service.findByAppointment).toHaveBeenCalledWith(10, 100);
    });
  });

  describe('findConsultantHistory', () => {
    it('calls service with correct parameters', async () => {
      const { controller, service } = setup();
      service.findConsultantHistory.mockResolvedValue({
        requesterId: 50,
        requesterName: 'Test Patient',
        notes: [],
      });

      await expect(
        controller.findConsultantHistory({ user: { userId: 100 } } as never, 50),
      ).resolves.toMatchObject({ requesterId: 50 });

      expect(service.findConsultantHistory).toHaveBeenCalledWith(50, 100);
    });
  });

  describe('findAuditHistory', () => {
    it('calls service with correct parameters', async () => {
      const { controller, service } = setup();
      service.findAuditHistory.mockResolvedValue([
        {
          cnaId: 1,
          cnId: 1,
          psyId: 100,
          cnaDate: new Date(),
          cnaIpAddress: '127.0.0.1',
        },
      ]);

      await expect(
        controller.findAuditHistory({ user: { userId: 100 } } as never, 1),
      ).resolves.toHaveLength(1);

      expect(service.findAuditHistory).toHaveBeenCalledWith(1, 100);
    });
  });
});
