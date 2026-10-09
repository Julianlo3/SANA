import { Module } from '@nestjs/common';
import { SecurityLogService } from './security-log.service.js';

@Module({
  providers: [SecurityLogService],
  exports: [SecurityLogService],
})
export class SecurityLogModule {}
