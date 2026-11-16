import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { Section } from '../middlewares/section.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import {
  AppointmentsReportQueryDto,
  AttendanceReportQueryDto,
  BaseReportQueryDto,
  DonationsEvolutionQueryDto,
  DonationsHistoryQueryDto,
} from './dto/report-query.dto.js';
import type {
  AppointmentsEvolutionReport,
  AttendanceReport,
  DonationsEvolutionReport,
  DonationsHistoryReport,
  GeneralManagementReport,
  ReportsSummary,
} from './reports.interface.js';
import { ReportsService } from './reports.service.js';

/** Exposes administrative, aggregate-only database reports. */
@Controller('reports')
@Section('Reports')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Legacy summary endpoint.
   * GET /api/v1/reports/summary
   */
  @Get('summary')
  getSummary(): Promise<ReportsSummary> {
    return this.reportsService.getSummary();
  }

  /**
   * Report 1: General Management Report.
   * GET /api/v1/reports/general
   */
  @Get('general')
  getGeneralReport(
    @Query() query: BaseReportQueryDto,
  ): Promise<GeneralManagementReport> {
    return this.reportsService.getGeneralReport(query);
  }

  /**
   * Report 2: Appointments Evolution Report.
   * GET /api/v1/reports/appointments-evolution
   */
  @Get('appointments-evolution')
  getAppointmentsEvolutionReport(
    @Query() query: AppointmentsReportQueryDto,
  ): Promise<AppointmentsEvolutionReport> {
    return this.reportsService.getAppointmentsEvolutionReport(query);
  }

  /**
   * Report 3: Attendance and No-show Report.
   * GET /api/v1/reports/attendance
   */
  @Get('attendance')
  getAttendanceReport(
    @Query() query: AttendanceReportQueryDto,
  ): Promise<AttendanceReport> {
    return this.reportsService.getAttendanceReport(query);
  }

  /**
   * Report 4: Donations History Report.
   * GET /api/v1/reports/donations-history
   */
  @Get('donations-history')
  getDonationsHistoryReport(
    @Query() query: DonationsHistoryQueryDto,
  ): Promise<DonationsHistoryReport> {
    return this.reportsService.getDonationsHistoryReport(query);
  }

  /**
   * Report 5: Behavior and Evolution of Contributions Report.
   * GET /api/v1/reports/donations-evolution
   */
  @Get('donations-evolution')
  getDonationsEvolutionReport(
    @Query() query: DonationsEvolutionQueryDto,
  ): Promise<DonationsEvolutionReport> {
    return this.reportsService.getDonationsEvolutionReport(query);
  }
}
