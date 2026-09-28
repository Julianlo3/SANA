import { describe, expect, it, vi } from 'vitest';
import { ClinicalNotesService } from '../../src/clinical-notes/clinical-notes.service.js';

function setup() {
  const clinicalNotesRepo = {
    create: vi.fn(),
    findById: vi.fn(),
    findByAppointment: vi.fn(),
    findConsultantHistory: vi.fn(),
    recordAudit: vi.fn(),
    findAuditHistory: vi.fn(),
    isAppointmentCompleted: vi.fn(),
    isTreatingPsychologist: vi.fn(),
    getAppointmentDetails: vi.fn(),
  };

  const appointmentsRepo = {
    findById: vi.fn(),
  };

  return {
    service: new ClinicalNotesService(clinicalNotesRepo as never, appointmentsRepo as never),
    clinicalNotesRepo,
    appointmentsRepo,
  };
}

describe('ClinicalNotesService.registerAttention', () => {
  it('rejects registration when terms are not accepted', async () => {
    const { service, clinicalNotesRepo } = setup();

    await expect(
      service.registerAttention(
        { appId: 1, termsAccepted: false, observation: 'Test' },
        100,
        {} as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'TERMS_NOT_ACCEPTED' }),
    });
    expect(clinicalNotesRepo.create).not.toHaveBeenCalled();
  });

  it('rejects registration for non-existent appointment', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.getAppointmentDetails.mockResolvedValue(null);

    await expect(
      service.registerAttention(
        { appId: 999, termsAccepted: true, observation: 'Test' },
        100,
        {} as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'APPOINTMENT_NOT_FOUND' }),
    });
    expect(clinicalNotesRepo.create).not.toHaveBeenCalled();
  });

  it('rejects registration for non-completed appointment', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.getAppointmentDetails.mockResolvedValue({
      appId: 1,
      appState: 'confirmada',
      psyId: 100,
      reqId: 50,
    });

    await expect(
      service.registerAttention(
        { appId: 1, termsAccepted: true, observation: 'Test' },
        100,
        {} as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'APPOINTMENT_NOT_COMPLETED' }),
    });
    expect(clinicalNotesRepo.create).not.toHaveBeenCalled();
  });

  it('rejects registration when psychologist is not the treating professional', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.getAppointmentDetails.mockResolvedValue({
      appId: 1,
      appState: 'realizada',
      psyId: 200, // Different psychologist
      reqId: 50,
    });

    await expect(
      service.registerAttention(
        { appId: 1, termsAccepted: true, observation: 'Test' },
        100,
        {} as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'NOT_TREATING_PSYCHOLOGIST' }),
    });
    expect(clinicalNotesRepo.create).not.toHaveBeenCalled();
  });

  it('registers attention with observation successfully', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.getAppointmentDetails.mockResolvedValue({
      appId: 1,
      appState: 'realizada',
      psyId: 100,
      reqId: 50,
    });
    clinicalNotesRepo.create.mockResolvedValue(42);
    clinicalNotesRepo.recordAudit.mockResolvedValue(undefined);

    await expect(
      service.registerAttention(
        { appId: 1, termsAccepted: true, observation: 'Consulta de seguimiento' },
        100,
        { headers: {}, socket: { remoteAddress: '127.0.0.1' } } as never,
      ),
    ).resolves.toMatchObject({
      cnId: 42,
      appId: 1,
      psyId: 100,
      cnObservation: 'Consulta de seguimiento',
    });

    expect(clinicalNotesRepo.create).toHaveBeenCalledWith({
      appId: 1,
      psyId: 100,
      cnObservation: 'Consulta de seguimiento',
      cnTermsAccepted: true,
    });
    expect(clinicalNotesRepo.recordAudit).toHaveBeenCalled();
  });

  it('registers attention without observation successfully', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.getAppointmentDetails.mockResolvedValue({
      appId: 1,
      appState: 'realizada',
      psyId: 100,
      reqId: 50,
    });
    clinicalNotesRepo.create.mockResolvedValue(42);
    clinicalNotesRepo.recordAudit.mockResolvedValue(undefined);

    await expect(
      service.registerAttention(
        { appId: 1, termsAccepted: true, observation: undefined },
        100,
        { headers: {}, socket: { remoteAddress: '127.0.0.1' } } as never,
      ),
    ).resolves.toMatchObject({
      cnId: 42,
      appId: 1,
      psyId: 100,
      cnObservation: '',
    });

    expect(clinicalNotesRepo.create).toHaveBeenCalledWith({
      appId: 1,
      psyId: 100,
      cnObservation: '',
      cnTermsAccepted: true,
    });
  });
});

describe('ClinicalNotesService.findById', () => {
  it('returns clinical note when psychologist has access', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.findById.mockResolvedValue({
      cnId: 1,
      appId: 10,
      psyId: 100,
      cnObservation: 'Test observation',
      cnTermsAccepted: true,
      cnCreatedAt: new Date(),
    });

    await expect(service.findById(1, 100)).resolves.toMatchObject({
      cnId: 1,
      appId: 10,
      psyId: 100,
    });
  });

  it('denies access when psychologist is not the author', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.findById.mockResolvedValue(null);

    await expect(service.findById(1, 200)).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'ACCESS_DENIED' }),
    });
  });
});

describe('ClinicalNotesService.findByAppointment', () => {
  it('returns notes when psychologist is treating professional', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.isTreatingPsychologist.mockResolvedValue(true);
    clinicalNotesRepo.findByAppointment.mockResolvedValue([
      {
        cnId: 1,
        appId: 10,
        psyId: 100,
        cnObservation: 'Test',
        cnTermsAccepted: true,
        cnCreatedAt: new Date(),
      },
    ]);

    await expect(service.findByAppointment(10, 100)).resolves.toHaveLength(1);
    expect(clinicalNotesRepo.isTreatingPsychologist).toHaveBeenCalledWith(10, 100);
  });

  it('denies access when psychologist is not treating professional', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.isTreatingPsychologist.mockResolvedValue(false);

    await expect(service.findByAppointment(10, 200)).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'NOT_TREATING_PSYCHOLOGIST' }),
    });
  });
});

describe('ClinicalNotesService.findConsultantHistory', () => {
  it('returns consultant history for treating psychologist', async () => {
    const { service, clinicalNotesRepo, appointmentsRepo } = setup();
    clinicalNotesRepo.findConsultantHistory.mockResolvedValue([
      {
        cnId: 1,
        appId: 10,
        appDate: new Date(),
        psychologistName: 'Dr. Test',
        cnObservation: 'Test observation',
        cnCreatedAt: new Date(),
      },
    ]);
    appointmentsRepo.findById.mockResolvedValue({
      requesterName: 'Test Patient',
    } as never);

    await expect(service.findConsultantHistory(50, 100)).resolves.toMatchObject({
      requesterId: 50,
      requesterName: 'Test Patient',
      notes: expect.arrayContaining([
        expect.objectContaining({
          psychologistName: 'Dr. Test',
        }),
      ]),
    });
  });
});

describe('ClinicalNotesService.findAuditHistory', () => {
  it('returns audit history when psychologist has access', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.findById.mockResolvedValue({
      cnId: 1,
      appId: 10,
      psyId: 100,
      cnObservation: 'Test',
      cnTermsAccepted: true,
      cnCreatedAt: new Date(),
    });
    clinicalNotesRepo.findAuditHistory.mockResolvedValue([
      {
        cnaId: 1,
        cnId: 1,
        psyId: 100,
        cnaDate: new Date(),
        cnaIpAddress: '127.0.0.1',
      },
    ]);

    await expect(service.findAuditHistory(1, 100)).resolves.toHaveLength(1);
  });

  it('denies audit history access when psychologist is not the author', async () => {
    const { service, clinicalNotesRepo } = setup();
    clinicalNotesRepo.findById.mockResolvedValue(null);

    await expect(service.findAuditHistory(1, 200)).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'ACCESS_DENIED' }),
    });
  });
});
