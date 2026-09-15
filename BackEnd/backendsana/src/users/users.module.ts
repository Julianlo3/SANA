import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../modules/auth.module.js';
import { Appointment } from './entities/appointment.entity.js';
import { Person } from './entities/person.entity.js';
import { PersonRol } from './entities/person-rol.entity.js';
import { RequesterDependent } from './entities/requester-dependent.entity.js';
import { Rol } from './entities/rol.entity.js';
import { Schedule } from './entities/schedule.entity.js';
import { UserAccount } from './entities/user-account.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Person,
      PersonRol,
      Rol,
      UserAccount,
      Appointment,
      RequesterDependent,
      Schedule,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
