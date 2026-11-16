import { Injectable } from '@nestjs/common';
import type {
  AppointmentsReportQueryDto,
  AttendanceReportQueryDto,
  BaseReportQueryDto,
  DonationsEvolutionQueryDto,
  DonationsHistoryQueryDto,
} from './dto/report-query.dto.js';
import { resolveReportDateRange } from './reports-date.util.js';
import type {
  AppointmentsEvolutionReport,
  AttendanceReport,
  DonationsEvolutionReport,
  DonationsHistoryReport,
  GeneralManagementReport,
  ReportsSummary,
} from './reports.interface.js';
import { ReportsRepository } from './reports.repository.js';

/** Provides aggregated and detailed reports without exposing sensitive clinical data. */
@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  /** Legacy summary metrics */
  getSummary(): Promise<ReportsSummary> {
    return this.reportsRepository.getSummary();
  }

  /** Report 1: General Management Report */
  getGeneralReport(query: BaseReportQueryDto): Promise<GeneralManagementReport> {
    const range = resolveReportDateRange(query);
    return this.reportsRepository.getGeneralReport(range);
  }

  /** Report 2: Appointments Evolution Report */
  getAppointmentsEvolutionReport(
    query: AppointmentsReportQueryDto,
  ): Promise<AppointmentsEvolutionReport> {
    const range = resolveReportDateRange(query);
    return this.reportsRepository.getAppointmentsEvolutionReport(range, query);
  }

  /** Report 3: Attendance and No-show Report */
  getAttendanceReport(
    query: AttendanceReportQueryDto,
  ): Promise<AttendanceReport> {
    const range = resolveReportDateRange(query);
    return this.reportsRepository.getAttendanceReport(range, query);
  }

  /** Report 4: Donations History Report */
  getDonationsHistoryReport(
    query: DonationsHistoryQueryDto,
  ): Promise<DonationsHistoryReport> {
    const range = resolveReportDateRange(query);
    return this.reportsRepository.getDonationsHistoryReport(range, query);
  }

  /** Report 5: Donations Behavior and Evolution Report */
  getDonationsEvolutionReport(
    query: DonationsEvolutionQueryDto,
  ): Promise<DonationsEvolutionReport> {
    const range = resolveReportDateRange(query);
    return this.reportsRepository.getDonationsEvolutionReport(range, query);
  }
}
