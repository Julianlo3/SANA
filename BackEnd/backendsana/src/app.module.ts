import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { appConfig, validateEnvironment } from './config/app.config.js';
import { AuthModule } from './modules/auth.module.js';
import { UsersModule } from './users/users.module.js';
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
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}