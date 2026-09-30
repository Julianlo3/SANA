import { describe, expect, it, vi } from 'vitest';
import { AppointmentsRepository } from '../../src/appointments/appointments.repository.js';

/**
 * Creates a mock requester object for testing purposes.
 * @returns A mock requester object with default values.
 */
function requester() {
  return {
    name: 'Nuevo nombre no debe reemplazarlo',
    cardType: 'CC',
    identityDocument: '10212265698',
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
      .mockResolvedValueOnce([{ app_id: 42 }])
      .mockResolvedValueOnce([{ pd_id: 1 }]) // data_treatment policy
      .mockResolvedValueOnce([{ pd_id: 2 }]); // dependent_consent policy (not used for self)
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
    expect(manager.query).toHaveBeenCalledTimes(7);
    expect(manager.query.mock.calls[1][0]).not.toContain('per_name =');
    expect(manager.query.mock.calls[3][0]).toContain("'pendiente'");
  });
});

describe('AppointmentsRepository.findPatientPsychologistHistory', () => {
  it('resolves self or dependent identity from the selected appointment and counts completed appointments only', async () => {
    const dataSource = { query: vi.fn().mockResolvedValue([]) };
    const repository = new AppointmentsRepository(dataSource as never);

    await repository.findPatientPsychologistHistory(42);

    const [sql, params] = dataSource.query.mock.calls[0] as [string, number[]];
    expect(params).toEqual([42]);
    expect(sql).toContain('WHERE app_id = $1');
    expect(sql).toContain('target.app_patient_dependent_id IS NOT NULL');
    expect(sql).toContain('a.app_patient_dependent_id = target.app_patient_dependent_id');
    expect(sql).toContain('a.app_patient_person_id = target.app_patient_person_id');
    expect(sql).toContain("a.app_state = 'realizada'");
    expect(sql).not.toContain("'confirmada', 'asignada'");
    expect(sql).toContain('LAG(psy_id) OVER (ORDER BY app_date, app_id)');
    expect(sql).toContain('GROUP BY psy_id, streak_group');
  });
});

