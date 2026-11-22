import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard.js';
import { OriginGuard } from '../../src/guards/origin.guard.js';
import { ROLES_KEY, RolesGuard } from '../../src/guards/roles.guard.js';
import { ReportPreset } from '../../src/reports/dto/report-presets.enum.js';
import { ReportsController } from '../../src/reports/reports.controller.js';

describe('ReportsController', () => {
  it('restricts the entire controller to authenticated administrators', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ReportsController)).toEqual([
      OriginGuard,
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, ReportsController)).toEqual([
      'administrador',
    ]);
  });

  it('delegates report calls to ReportsService', async () => {
    const mockService = {
      getGeneralReport: vi.fn().mockResolvedValue({}),
      getAppointmentsEvolutionReport: vi.fn().mockResolvedValue({}),
      getAttendanceReport: vi.fn().mockResolvedValue({}),
      getDonationsHistoryReport: vi.fn().mockResolvedValue({}),
      getDonationsEvolutionReport: vi.fn().mockResolvedValue({}),
    };

    const controller = new ReportsController(mockService as never);

    await controller.getGeneralReport({ preset: ReportPreset.Today });
    expect(mockService.getGeneralReport).toHaveBeenCalledWith({
      preset: ReportPreset.Today,
    });

    await controller.getAppointmentsEvolutionReport({
      preset: ReportPreset.Last7Days,
    });
    expect(mockService.getAppointmentsEvolutionReport).toHaveBeenCalledWith({
      preset: ReportPreset.Last7Days,
    });

    await controller.getAttendanceReport({ preset: ReportPreset.LastMonth });
    expect(mockService.getAttendanceReport).toHaveBeenCalledWith({
      preset: ReportPreset.LastMonth,
    });

    await controller.getDonationsHistoryReport({
      preset: ReportPreset.LastMonth,
    });
    expect(mockService.getDonationsHistoryReport).toHaveBeenCalledWith({
      preset: ReportPreset.LastMonth,
    });

    await controller.getDonationsEvolutionReport({
      preset: ReportPreset.CurrentYear,
    });
    expect(mockService.getDonationsEvolutionReport).toHaveBeenCalledWith({
      preset: ReportPreset.CurrentYear,
    });
  });
});
