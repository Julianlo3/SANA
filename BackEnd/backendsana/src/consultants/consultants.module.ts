import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultantsController } from './consultants.controller.js';
import { ConsultantsService } from './consultants.service.js';
import { Person } from '../users/entities/person.entity.js';
import { PersonRol } from '../users/entities/person-rol.entity.js';
import { Rol } from '../users/entities/rol.entity.js';
import { Appointment } from '../users/entities/appointment.entity.js';
import { Psychologist } from '../users/entities/psychologist.entity.js';
import { AuthModule } from '../modules/auth.module.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Person,
      PersonRol,
      Rol,
      Appointment,
      Psychologist,
    ]),
  ],
  controllers: [ConsultantsController],
  providers: [ConsultantsService],
  exports: [ConsultantsService],
})
export class ConsultantsModule {}
