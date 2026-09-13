import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service.js';

/**
 * Guard that checks for a valid JWT access token in the request headers.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

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
    if (!token) throw new UnauthorizedException('Access token is required');
    request.user = await this.authService.authenticate(token);
    return true;
  }
}
