import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import { SecurityLogService } from './security-log.service.js';

/**
 * Controller for security logs management.
 * Access restricted to administrators only.
 */
@Controller('security-logs')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator)
export class SecurityLogsController {
  constructor(private readonly securityLogService: SecurityLogService) { }

  /**
   * Gets security access logs with optional filters.
   * Administrator can query the log and filter by user or date range
   * @param userId Optional filter by user ID
   * @param startDate Optional filter by start date (ISO format)
   * @param endDate Optional filter by end date (ISO format)
   * @returns Array of security access log entries
   */
  @Get()
  findSecurityLogs(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userIdNum = userId ? Number.parseInt(userId, 10) : undefined;
    return this.securityLogService.findSecurityLogs(userIdNum, startDate, endDate);
  }
}
