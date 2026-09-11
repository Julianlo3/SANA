import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Guard that checks if the request's origin is allowed based on the configured CORS origins.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Checks if the request's origin is allowed.
   * @param context The execution context.
   * @returns A boolean indicating if the request's origin is allowed.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.headers.origin;
    const allowedOrigins = this.configService
      .getOrThrow<string>('CORS_ORIGIN')
      .split(',')
      .map((value) => value.trim());
    if (!origin || !allowedOrigins.includes(origin))
      throw new ForbiddenException('Request origin is not allowed');
    return true;
  }
}
