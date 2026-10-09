import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { appConfig, validateEnvironment } from './config/app.config.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { ScheduleModule } from './schedule/schedule.module.js';
import { ConsultantsModule } from './consultants/consultants.module.js';
import { PolicyModule } from './policy/policy.module.js';
import { ClinicalNotesModule } from './clinical-notes/clinical-notes.module.js';
import { SecurityLogsModule } from './security-logs/security-logs.module.js';
import { ContentModule } from './content/content.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnvironment,
    }),

    TypeOrmModule.forRootAsync({
      useFactory: appConfig,
    }),

    AuthModule,
    UsersModule,
    AppointmentsModule,
    ScheduleModule,
    ConsultantsModule,
    PolicyModule,
    ClinicalNotesModule,
    SecurityLogsModule,
    ContentModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}