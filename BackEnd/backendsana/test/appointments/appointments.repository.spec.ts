import { describe, expect, it, vi } from 'vitest';
import { AppointmentsRepository } from '../../src/appointments/appointments.repository.js';

function requester() {
  return {
    name: 'Nuevo nombre no debe reemplazarlo',
    cardType: 'CC',
    identityDocument: 12345678,
    contactNumber: '3001234567',
    email: 'nuevo@example.com',
    birthdate: '1990-01-01',
    gender: 'F',
    termsAccepted: true,
  };
}

describe('AppointmentsRepository.createRequest', () => {
  it('persists the complete request in one transaction', async () => {
    const manager = { query: vi.fn() };
    const dataSource = { query: vi.fn(), transaction: vi.fn() };
    manager.query
      .mockResolvedValueOnce([{ per_id: 7 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ app_id: 42 }]);
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));

    const repository = new AppointmentsRepository(dataSource as never);
    await expect(
      repository.createRequest({
        requester: requester(),
        dependent: null,
        appType: 'virtual',
        appReason: null,
        appDateIdeal: null,
      }),
    ).resolves.toBe(42);

    expect(dataSource.transaction).toHaveBeenCalledOnce();
    expect(manager.query).toHaveBeenCalledTimes(4);
    expect(manager.query.mock.calls[1][0]).not.toContain('per_name =');
    expect(manager.query.mock.calls[3][0]).toContain("'pendiente'");
  });
});

