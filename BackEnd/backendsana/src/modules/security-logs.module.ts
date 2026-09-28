import { Module } from '@nestjs/common';
import { SecurityLogsController } from '../controllers/security-logs.controller.js';
import { SecurityLogService } from '../services/security-log.service.js';
import { AuthModule } from './auth.module.js';

/**
 * Module for security logs management.
 * Provides endpoints for administrators to query security access logs.
 */
@Module({
  imports: [AuthModule],
  controllers: [SecurityLogsController],
  providers: [SecurityLogService],
  exports: [SecurityLogService],
})
export class SecurityLogsModule { }
