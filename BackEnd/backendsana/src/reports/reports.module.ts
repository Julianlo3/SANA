import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { SecurityLogModule } from '../security-logs/security-log.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';

/** Registers the administrator-only reporting feature. */
@Module({
  imports: [AuthModule, SecurityLogModule],
  controllers: [ReportsController],
  providers: [ReportsRepository, ReportsService, RolesGuard],
})
export class ReportsModule {}
