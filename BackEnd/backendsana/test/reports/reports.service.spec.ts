import { describe, expect, it, vi } from 'vitest';
import { AppointmentDateBasis, ReportPreset } from '../../src/reports/dto/report-presets.enum.js';
import { ReportsService } from '../../src/reports/reports.service.js';

describe('ReportsService', () => {
  const mockRepository = {
    getGeneralReport: vi.fn().mockResolvedValue({
      appointments: { total: 20 },
    }),
    getAppointmentsEvolutionReport: vi.fn().mockResolvedValue({
      totalAppointments: 15,
    }),
    getAttendanceReport: vi.fn().mockResolvedValue({
      metrics: { totalPastAppointments: 10 },
    }),
    getDonationsHistoryReport: vi.fn().mockResolvedValue({
      summary: { totalTransactions: 5 },
    }),
    getDonationsEvolutionReport: vi.fn().mockResolvedValue({
      summary: { confirmedCount: 4 },
    }),
  };

  const service = new ReportsService(mockRepository as never);

  it('delegates getGeneralReport resolving date range', async () => {
    const result = await service.getGeneralReport({ preset: ReportPreset.Today });
    expect(mockRepository.getGeneralReport).toHaveBeenCalledWith(
      expect.objectContaining({ preset: ReportPreset.Today }),
    );
    expect(result).toEqual({ appointments: { total: 20 } });
  });

  it('delegates getAppointmentsEvolutionReport passing range and query', async () => {
    const query = {
      preset: ReportPreset.Last7Days,
      dateBasis: AppointmentDateBasis.Scheduled,
    };
    const result = await service.getAppointmentsEvolutionReport(query);
    expect(mockRepository.getAppointmentsEvolutionReport).toHaveBeenCalledWith(
      expect.objectContaining({ preset: ReportPreset.Last7Days }),
      query,
    );
    expect(result).toEqual({ totalAppointments: 15 });
  });

  it('delegates getAttendanceReport', async () => {
    const query = { preset: ReportPreset.LastMonth, psyId: 3 };
    const result = await service.getAttendanceReport(query);
    expect(mockRepository.getAttendanceReport).toHaveBeenCalledWith(
      expect.objectContaining({ preset: ReportPreset.LastMonth }),
      query,
    );
    expect(result).toEqual({ metrics: { totalPastAppointments: 10 } });
  });

  it('delegates getDonationsHistoryReport', async () => {
    const query = { preset: ReportPreset.LastMonth, status: 'APPROVED' };
    const result = await service.getDonationsHistoryReport(query);
    expect(mockRepository.getDonationsHistoryReport).toHaveBeenCalledWith(
      expect.objectContaining({ preset: ReportPreset.LastMonth }),
      query,
    );
    expect(result).toEqual({ summary: { totalTransactions: 5 } });
  });

  it('delegates getDonationsEvolutionReport', async () => {
    const query = { preset: ReportPreset.CurrentYear };
    const result = await service.getDonationsEvolutionReport(query);
    expect(mockRepository.getDonationsEvolutionReport).toHaveBeenCalledWith(
      expect.objectContaining({ preset: ReportPreset.CurrentYear }),
      query,
    );
    expect(result).toEqual({ summary: { confirmedCount: 4 } });
  });
});
