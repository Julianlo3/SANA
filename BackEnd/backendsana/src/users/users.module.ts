import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { SecurityLogModule } from '../security-logs/security-log.module.js';
import { Appointment } from './entities/appointment.entity.js';
import { Person } from './entities/person.entity.js';
import { Psychologist } from './entities/psychologist.entity.js';
import { PersonRol } from './entities/person-rol.entity.js';
import { RequesterDependent } from './entities/requester-dependent.entity.js';
import { Rol } from './entities/rol.entity.js';
import { Schedule } from './entities/schedule.entity.js';
import { UserAccount } from './entities/user-account.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { EmailModule } from '../email/email.module.js';
import { RolesGuard } from '../guards/roles.guard.js';

@Module({
  imports: [
    AuthModule,
    SecurityLogModule,
    EmailModule,
    TypeOrmModule.forFeature([
      Person,
      Psychologist,
      PersonRol,
      Rol,
      UserAccount,
      Appointment,
      RequesterDependent,
      Schedule,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
})
export class UsersModule {}
