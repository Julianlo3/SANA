import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { PolicyModule } from '../policy/policy.module.js';
import { Appointment } from '../users/entities/appointment.entity.js';
import { Person } from '../users/entities/person.entity.js';
import { Dependent } from './entities/dependent.entity.js';
import { AppointmentAssignmentHistory } from './entities/appointment-assignment-history.entity.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { AppointmentsRepository } from './appointments.repository.js';
import { ScheduleModule } from '../schedule/schedule.module.js';
import { EmailModule } from '../email/email.module.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { SecurityLogModule } from '../security-logs/security-log.module.js';

@Module({
  imports: [
    AuthModule,
    SecurityLogModule,
    PolicyModule,
    ScheduleModule,
    EmailModule,
    TypeOrmModule.forFeature([
      Appointment,
      Dependent,
      Person,
      AppointmentAssignmentHistory,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository, RolesGuard],
  exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
