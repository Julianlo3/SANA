import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../controllers/auth.controller.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { GoogleIdentityService } from '../services/google-identity.service.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Module that encapsulates authentication-related functionality, including controllers, services, and guards.
 */
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    GoogleIdentityService,
    JwtAuthGuard,
    OriginGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
