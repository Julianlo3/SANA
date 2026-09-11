import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfig, validateEnvironment } from './config/app.config.js';
import { AuthModule } from './modules/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({ useFactory: appConfig }),
    AuthModule,
  ],
})
export class AppModule {}
