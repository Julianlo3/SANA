import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service.js';
import { Auth0IdentityService } from '../services/auth0-identity.service.js';

/**
 * Guard that checks for a valid JWT access token in the request headers.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly auth0IdentityService: Auth0IdentityService,
  ) {}

  /**
   * Checks if the request has a valid JWT access token.
   * @param context The execution context.
   * @returns A promise resolving to a boolean indicating if the request is authorized.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
      console.log('TOKEN:', {
      exists: !!token,
      parts: token?.split('.').length,
      start: token?.substring(0, 20),
    });
    console.log('\n=============================================');
    console.log('🎯 [Auth Guard] Token recibido en el backend:');
    console.log(token || '❌ No se recibió ningún token');
    console.log('=============================================\n');

    if (!token) throw new UnauthorizedException('Access token is required');
    const profile = await this.auth0IdentityService.verifyAccessToken(token);
    request.user = await this.authService.authenticateAuth0(profile);
    return true;
  }
}
