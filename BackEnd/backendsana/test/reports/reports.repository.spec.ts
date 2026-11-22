import { describe, expect, it, vi } from 'vitest';
import { AppointmentDateBasis, ReportPreset } from '../../src/reports/dto/report-presets.enum.js';
import { resolveReportDateRange } from '../../src/reports/reports-date.util.js';
import { ReportsRepository } from '../../src/reports/reports.repository.js';

describe('ReportsRepository', () => {
  it('calculates getGeneralReport correctly', async () => {
    const dataSource = {
      query: vi
        .fn()
        // appointmentsCurrent
        .mockResolvedValueOnce([
          {
            total: 10,
            completed: 5,
            scheduled: 3,
            cancelled: 1,
            no_show: 1,
          },
        ])
        // appointmentsPrevious
        .mockResolvedValueOnce([{ total: 8 }])
        // usersStats
        .mockResolvedValueOnce([
          {
            total_registered: 50,
            new_registered: 12,
            previous_new_registered: 10,
          },
        ])
        // donationsCurrent
        .mockResolvedValueOnce([{ count: 4, amount: '500000' }])
        // donationsPrevious
        .mockResolvedValueOnce([{ count: 2, amount: '250000' }])
        // appointmentsTimeline
        .mockResolvedValueOnce([
          {
            date: '2026-11-01',
            appointments_count: 5,
            completed_count: 3,
          },
        ])
        // donationsTimeline
        .mockResolvedValueOnce([
          {
            date: '2026-11-01',
            donations_count: 2,
            donations_amount: '250000',
          },
        ]),
    };

    const repository = new ReportsRepository(dataSource as never);
    const range = resolveReportDateRange({ preset: ReportPreset.Last7Days });
    const result = await repository.getGeneralReport(range);

    expect(result.appointments.total).toBe(10);
    expect(result.appointments.completed).toBe(5);
    expect(result.appointments.comparisonWithPrevious.difference).toBe(2);
    expect(result.users.totalRegistered).toBe(50);
    expect(result.donations.confirmedDonationsCount).toBe(4);
    expect(result.donations.amountComparison.currentAmountInCents).toBe('500000');
    expect(result.donations.amountComparison.percentage).toBe(100);
    expect(result.timeline).toHaveLength(1);
    expect(result.timeline[0].appointmentsCount).toBe(5);
    expect(result.timeline[0].donationsCount).toBe(2);
  });

  it('calculates getAppointmentsEvolutionReport with filters and records', async () => {
    const dataSource = {
      query: vi
        .fn()
        // currentCountRow
        .mockResolvedValueOnce([{ total: 15 }])
        // previousCountRow
        .mockResolvedValueOnce([{ total: 10 }])
        // byStateRows
        .mockResolvedValueOnce([
          { app_state: 'realizada', count: 8 },
          { app_state: 'confirmada', count: 7 },
        ])
        // byModalityRows
        .mockResolvedValueOnce([
          { app_type: 'presencial', count: 9 },
          { app_type: 'virtual', count: 6 },
        ])
        // byKindRows
        .mockResolvedValueOnce([
          { app_kind: 'valoracion', count: 10 },
          { app_kind: 'paquete', count: 5 },
        ])
        // dailyCounts
        .mockResolvedValueOnce([
          { day: '2026-11-05', count: 6 },
          { day: '2026-11-06', count: 2 },
        ])
        // timelineRows
        .mockResolvedValueOnce([
          {
            date: '2026-11-05',
            total: 6,
            realizada: 3,
            confirmada: 2,
            cancelada: 1,
            no_asistio: 0,
            otros: 0,
          },
        ])
        // recordsRows
        .mockResolvedValueOnce([
          {
            app_id: 1,
            app_date: new Date('2026-11-05T10:00:00Z'),
            app_created_at: new Date('2026-11-01T10:00:00Z'),
            app_state: 'realizada',
            app_type: 'presencial',
            app_kind: 'valoracion',
            psychologist_name: 'Dr. Test',
          },
        ]),
    };

    const repository = new ReportsRepository(dataSource as never);
    const range = resolveReportDateRange({ preset: ReportPreset.Last7Days });
    const result = await repository.getAppointmentsEvolutionReport(range, {
      preset: ReportPreset.Last7Days,
      dateBasis: AppointmentDateBasis.Scheduled,
      modality: 'presencial',
    });

    expect(result.dateBasis).toBe('scheduled');
    expect(result.totalAppointments).toBe(15);
    expect(result.comparisonWithPrevious.difference).toBe(5);
    expect(result.byState).toEqual([
      { state: 'realizada', count: 8, percentage: 53.33 },
      { state: 'confirmada', count: 7, percentage: 46.67 },
    ]);
    expect(result.peakDays.highest).toEqual({ day: '2026-11-05', count: 6 });
    expect(result.peakDays.lowest).toEqual({ day: '2026-11-06', count: 2 });
    expect(result.records).toHaveLength(1);
    expect(result.records[0].psychologistName).toBe('Dr. Test');
  });

  it('calculates getAttendanceReport rates and breakdowns', async () => {
    const dataSource = {
      query: vi
        .fn()
        // currentMetrics
        .mockResolvedValueOnce([
          {
            total_past: 12,
            completed: 8,
            no_show: 2,
            other_past: 2,
          },
        ])
        // prevMetrics
        .mockResolvedValueOnce([
          {
            completed: 6,
            no_show: 2,
          },
        ])
        // monthlyRows
        .mockResolvedValueOnce([
          {
            month: '2026-10',
            completed: 8,
            no_show: 2,
          },
        ])
        // psychologistRows
        .mockResolvedValueOnce([
          {
            psy_id: 1,
            psychologist_name: 'Dra. López',
            completed: 8,
            no_show: 2,
          },
        ])
        // modalityRows
        .mockResolvedValueOnce([
          {
            modality: 'presencial',
            completed: 5,
            no_show: 1,
          },
        ])
        // kindRows
        .mockResolvedValueOnce([
          {
            kind: 'valoracion',
            completed: 8,
            no_show: 2,
          },
        ]),
    };

    const repository = new ReportsRepository(dataSource as never);
    const range = resolveReportDateRange({ preset: ReportPreset.LastMonth });
    const result = await repository.getAttendanceReport(range, {});

    expect(result.metrics.totalPastAppointments).toBe(12);
    expect(result.metrics.completedAppointments).toBe(8);
    expect(result.metrics.noShowAppointments).toBe(2);
    expect(result.metrics.evaluatedAppointments).toBe(10);
    expect(result.metrics.attendanceRate).toBe(80);
    expect(result.metrics.noShowRate).toBe(20);
    expect(
      result.metrics.comparisonWithPreviousAttendanceRate.difference,
    ).toBe(5); // 80% vs 75% = 5%
    expect(result.byPsychologist[0].psychologistName).toBe('Dra. López');
  });

  it('calculates getDonationsHistoryReport with masked emails', async () => {
    const dataSource = {
      query: vi
        .fn()
        // summaryRow
        .mockResolvedValueOnce([
          {
            total_transactions: 10,
            confirmed_count: 8,
            confirmed_amount: '8000000',
            pending_count: 1,
            pending_amount: '1000000',
            declined_count: 1,
            declined_amount: '1000000',
          },
        ])
        // byStatusRows
        .mockResolvedValueOnce([
          { status: 'APPROVED', count: 8, amount: '8000000' },
          { status: 'PENDING', count: 1, amount: '1000000' },
          { status: 'DECLINED', count: 1, amount: '1000000' },
        ])
        // byPaymentMethodRows
        .mockResolvedValueOnce([
          {
            payment_method: 'NEQUI',
            count: 6,
            confirmed_count: 5,
            confirmed_amount: '5000000',
          },
        ])
        // transactionRows
        .mockResolvedValueOnce([
          {
            don_id: 101,
            don_wompi_transaction_id: 'wompi-txn-1',
            don_reference: 'ref-1',
            don_amount_in_cents: '1000000',
            don_currency: 'COP',
            don_status: 'APPROVED',
            don_payment_method_type: 'NEQUI',
            don_donor_full_name: 'Carlos Ruiz',
            don_donor_email: 'carlos.ruiz@gmail.com',
            don_created_at: new Date('2026-11-05T12:00:00Z'),
          },
        ]),
    };

    const repository = new ReportsRepository(dataSource as never);
    const range = resolveReportDateRange({ preset: ReportPreset.LastMonth });
    const result = await repository.getDonationsHistoryReport(range, {});

    expect(result.summary.totalTransactions).toBe(10);
    expect(result.summary.confirmedCount).toBe(8);
    expect(result.summary.averageConfirmedAmountInCents).toBe('1000000');
    expect(result.transactions[0].donorEmailMasked).toBe('c*********z@gmail.com');
  });

  it('calculates getDonationsEvolutionReport with value ranges', async () => {
    const dataSource = {
      query: vi
        .fn()
        // currentSummary
        .mockResolvedValueOnce([
          {
            confirmed_count: 5,
            total_amount: '5000000',
            average_amount: '1000000',
            highest_amount: '2000000',
            lowest_amount: '500000',
          },
        ])
        // prevSummary
        .mockResolvedValueOnce([
          {
            confirmed_count: 3,
            total_amount: '2500000',
          },
        ])
        // valueRangeRows
        .mockResolvedValueOnce([
          {
            range_label: '$20.000 a $50.000',
            count: 3,
            total_amount: '1000000',
          },
          {
            range_label: '$50.000 a $100.000',
            count: 2,
            total_amount: '4000000',
          },
        ])
        // timelineRows
        .mockResolvedValueOnce([
          {
            date: '2026-11-01',
            count: 2,
            amount: '2000000',
          },
        ]),
    };

    const repository = new ReportsRepository(dataSource as never);
    const range = resolveReportDateRange({ preset: ReportPreset.LastMonth });
    const result = await repository.getDonationsEvolutionReport(range, {});

    expect(result.summary.confirmedCount).toBe(5);
    expect(result.comparisonWithPrevious.percentageVariation).toBe(100);
    expect(result.comparisonWithPrevious.countComparison.difference).toBe(2);
    expect(result.valueRanges).toHaveLength(2);
    expect(result.valueRanges[0].percentageOfTotal).toBe(60);
    expect(result.timeline).toHaveLength(1);
  });
});
