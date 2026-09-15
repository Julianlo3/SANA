import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '../controllers/auth.controller.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RateLimitGuard } from '../guards/rate-limit.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { AuthService } from '../services/auth.service.js';
import { GoogleIdentityService } from '../services/google-identity.service.js';
import { SecurityLogService } from '../services/security-log.service.js';

/**
 * Module that encapsulates authentication-related functionality, including controllers, services, guards, rate limiting, and security logging.
 */
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    GoogleIdentityService,
    SecurityLogService,
    JwtAuthGuard,
    OriginGuard,
    RateLimitGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    SecurityLogService,
    JwtAuthGuard,
    OriginGuard,
    RateLimitGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
