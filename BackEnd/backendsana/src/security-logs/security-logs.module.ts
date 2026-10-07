import { Module } from '@nestjs/common';
import { SecurityLogsController } from './security-logs.controller.js';
import { SecurityLogModule } from './security-log.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../guards/roles.guard.js';

/**
 * Module for security logs management.
 * Provides endpoints for administrators to query security access logs.
 */
@Module({
  imports: [AuthModule, SecurityLogModule],
  controllers: [SecurityLogsController],
  providers: [RolesGuard],
})
export class SecurityLogsModule { }
