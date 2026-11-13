import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { ScheduleModule } from '../schedule/schedule.module.js';
import { SecurityLogModule } from '../security-logs/security-log.module.js';
import { CarePackagesController } from './care-packages.controller.js';
import { CarePackagesService } from './care-packages.service.js';

@Module({
  imports: [AuthModule, ScheduleModule, SecurityLogModule],
  controllers: [CarePackagesController],
  providers: [CarePackagesService, RolesGuard],
})
export class CarePackagesModule {}
