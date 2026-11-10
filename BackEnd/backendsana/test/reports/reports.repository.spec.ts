import { describe, expect, it, vi } from 'vitest';
import { ReportsRepository } from '../../src/reports/reports.repository.js';

describe('ReportsRepository', () => {
  it('returns only aggregate report metrics', async () => {
    const dataSource = {
      query: vi.fn().mockResolvedValue([
        {
          total_completed_appointments: 12,
          average_completed_appointments_per_psychologist: 3,
          active_psychologists: 4,
          total_consultants: 6,
          average_appointments_per_consultant: 2.5,
          total_amount_in_cents: '250000',
          approved_donations: 5,
          people_who_donated: 4,
        },
      ]),
    };
    const repository = new ReportsRepository(dataSource as never);

    await expect(repository.getSummary()).resolves.toEqual({
      psychology: {
        totalCompletedAppointments: 12,
        averageCompletedAppointmentsPerPsychologist: 3,
        activePsychologists: 4,
      },
      system: { totalConsultants: 6, averageAppointmentsPerConsultant: 2.5 },
      donations: {
        totalAmountInCents: '250000',
        approvedDonations: 5,
        peopleWhoDonated: 4,
      },
    });

    const sql = dataSource.query.mock.calls[0][0] as string;
    expect(sql).toContain("app_state = 'realizada'");
    expect(sql).toContain("don_status = 'APPROVED'");
  });
});
