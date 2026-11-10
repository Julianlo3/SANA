import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Section } from '../middlewares/section.decorator.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import { ReportsService } from './reports.service.js';

/** Exposes administrative, aggregate-only database reports. */
@Controller('reports')
@Section('Reports')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** GET /api/v1/reports/summary */
  @Get('summary')
  getSummary() {
    return this.reportsService.getSummary();
  }
}
