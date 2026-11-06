import { Module } from '@nestjs/common';
import { SecurityLogService } from './security-log.service.js';

/** Exports the shared service used to record security-relevant events. */
@Module({
  providers: [SecurityLogService],
  exports: [SecurityLogService],
})
export class SecurityLogModule {}
