import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../modules/auth.module.js';
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

@Module({
  imports: [
    AuthModule,
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
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
