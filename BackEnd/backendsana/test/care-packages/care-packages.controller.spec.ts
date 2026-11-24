import { describe, expect, it, vi } from 'vitest';
import { CarePackagesController } from '../../src/care-packages/care-packages.controller.js';

function setup() {
  const service = {
    suggest: vi.fn(),
    findSuggestions: vi.fn(),
    findMyPackages: vi.fn(),
    findAll: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    availability: vi.fn(),
    scheduleAppointment: vi.fn(),
    followUpValuationAvailability: vi.fn(),
    scheduleFollowUpValuation: vi.fn(),
    close: vi.fn(),
  };

  return {
    controller: new CarePackagesController(service as never),
    service,
  };
}

describe('CarePackagesController', () => {
  it('delegates suggest to service with psychologistId', async () => {
    const { controller, service } = setup();
    service.suggest.mockResolvedValue({ id: 1, state: 'sugerido' });

    const dto = {
      assessmentAppointmentId: 5,
      sessionLimit: 8,
      priority: 'alta' as const,
      comment: 'Requiere seguimiento intensivo',
    };

    const res = await controller.suggest(dto, { user: { personId: 42 } } as never);
    expect(res).toEqual({ id: 1, state: 'sugerido' });
    expect(service.suggest).toHaveBeenCalledWith(dto, 42);
  });

  it('delegates findSuggestions to service', async () => {
    const { controller, service } = setup();
    service.findSuggestions.mockResolvedValue([{ id: 1, state: 'sugerido' }]);

    const res = await controller.findSuggestions();
    expect(res).toEqual([{ id: 1, state: 'sugerido' }]);
    expect(service.findSuggestions).toHaveBeenCalled();
  });

  it('delegates findMyPackages to service with requesterId', async () => {
    const { controller, service } = setup();
    service.findMyPackages.mockResolvedValue([{ id: 1, state: 'activo' }]);

    const res = await controller.findMyPackages({ user: { personId: 10 } } as never);
    expect(res).toEqual([{ id: 1, state: 'activo' }]);
    expect(service.findMyPackages).toHaveBeenCalledWith(10);
  });

  it('delegates approve to service with secretaryId', async () => {
    const { controller, service } = setup();
    service.approve.mockResolvedValue({ id: 1, state: 'activo' });

    const dto = { sessionLimit: 10, priority: 'media' as const };
    const res = await controller.approve(1, dto, { user: { personId: 99 } } as never);
    expect(res).toEqual({ id: 1, state: 'activo' });
    expect(service.approve).toHaveBeenCalledWith(1, dto, 99);
  });

  it('delegates reject to service with secretaryId and reason', async () => {
    const { controller, service } = setup();
    service.reject.mockResolvedValue({ id: 1, state: 'rechazado' });

    const dto = { reason: 'No cumple con criterios de derivación' };
    const res = await controller.reject(1, dto, { user: { personId: 99 } } as never);
    expect(res).toEqual({ id: 1, state: 'rechazado' });
    expect(service.reject).toHaveBeenCalledWith(1, dto, 99);
  });

  it('delegates scheduleOwn to service with requesterId', async () => {
    const { controller, service } = setup();
    service.scheduleAppointment.mockResolvedValue({ appId: 20 });

    const dto = { appDate: '2026-12-01T10:00:00Z' };
    const res = await controller.scheduleOwn(1, dto, { user: { personId: 50 } } as never);
    expect(res).toEqual({ appId: 20 });
    expect(service.scheduleAppointment).toHaveBeenCalledWith(1, dto, { requesterId: 50 });
  });

  it('delegates schedule to service with secretaryId', async () => {
    const { controller, service } = setup();
    service.scheduleAppointment.mockResolvedValue({ appId: 21 });

    const dto = { appDate: '2026-12-01T11:00:00Z' };
    const res = await controller.schedule(1, dto, { user: { personId: 99 } } as never);
    expect(res).toEqual({ appId: 21 });
    expect(service.scheduleAppointment).toHaveBeenCalledWith(1, dto, { secretaryId: 99 });
  });

  it('delegates followUpValuationAvailability to service with requesterId', async () => {
    const { controller, service } = setup();
    service.followUpValuationAvailability.mockResolvedValue([{ date: '2026-12-01' }]);

    const query = {
      appointmentStart: '2026-12-01T08:00:00Z',
      duration: 60,
      delayHours: 24,
    };
    const res = await controller.followUpValuationAvailability(1, query, {
      user: { personId: 50 },
    } as never);

    expect(res).toEqual([{ date: '2026-12-01' }]);
    expect(service.followUpValuationAvailability).toHaveBeenCalledWith(1, 50, query);
  });

  it('delegates scheduleFollowUpValuation to service with requesterId', async () => {
    const { controller, service } = setup();
    service.scheduleFollowUpValuation.mockResolvedValue({
      appId: 99,
      appKind: 'valoracion',
      appState: 'confirmada',
    });

    const dto = {
      appDate: '2026-12-02T10:00:00Z',
      appType: 'virtual' as const,
      appReason: 'Continuidad de proceso',
    };
    const res = await controller.scheduleFollowUpValuation(1, dto, {
      user: { personId: 50 },
    } as never);

    expect(res).toEqual({
      appId: 99,
      appKind: 'valoracion',
      appState: 'confirmada',
    });
    expect(service.scheduleFollowUpValuation).toHaveBeenCalledWith(1, dto, 50);
  });
});

