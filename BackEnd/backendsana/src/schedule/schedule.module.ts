import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { PolicyModule } from '../policy/policy.module.js';
import { Schedule } from '../users/entities/schedule.entity.js';
import { RecurringScheduleBlock } from './entities/recurring-schedule-block.entity.js';
import { ScheduleController } from './schedule.controller.js';
import { ScheduleSecretaryController } from './schedule.secretary.controller.js';
import { ScheduleRepository } from './schedule.repository.js';
import { ScheduleService } from './schedule.service.js';

@Module({
  imports: [AuthModule, PolicyModule, TypeOrmModule.forFeature([Schedule, RecurringScheduleBlock])],
  controllers: [ScheduleController, ScheduleSecretaryController],
  providers: [ScheduleRepository, ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}