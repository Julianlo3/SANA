import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RateLimitGuard } from '../guards/rate-limit.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { Auth0IdentityService } from './auth0-identity.service.js';
import { SecurityLogModule } from '../security-logs/security-log.module.js';

/**
 * Module that encapsulates authentication-related functionality, including controllers, services, guards, rate limiting, and security logging.
 */
@Module({
  imports: [SecurityLogModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    Auth0IdentityService,
    JwtAuthGuard,
    OriginGuard,
    RateLimitGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    Auth0IdentityService,
    JwtAuthGuard,
    OriginGuard,
    RateLimitGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
