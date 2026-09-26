import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import { SECTION_KEY } from '../middlewares/section.decorator.js';
import { SecurityLogService } from '../services/security-log.service.js';

export const ROLES_KEY = 'roles';

/**
 * Guard that verifies if the authenticated user possesses the required role(s) to access a route or section.
 * When an unauthorized access attempt by a logged-in user is detected, it logs the incident to `security_access_log`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly securityLogService: SecurityLogService,
  ) { }

  /**
   * Evaluates if the current request is authorized based on role metadata.
   * @param context The execution context.
   * @returns A boolean indicating whether access is granted.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    const hasRole = Boolean(
      user && requiredRoles.some((role) => user.roles.includes(role)),
    );

    if (!hasRole) {
      if (user?.userId) {
        const explicitSection = this.reflector.getAllAndOverride<string>(
          SECTION_KEY,
          [context.getHandler(), context.getClass()],
        );
        const section =
          explicitSection ??
          `${request.method} ${request.originalUrl || request.url || 'Unknown'}`;

        this.securityLogService
          .logRoleMismatch({
            userId: user.userId,
            email: user.email,
            userRoles: user.roles ?? [],
            requiredRoles,
            section,
          })
          .catch((err) => {
            this.logger.error(
              `Module:roles-guard, Function:logRoleMismatch, result-error: reason-log_failed, error-${err instanceof Error ? err.message : String(err)}`,
            );
        });

      }

      throw new ForbiddenException('Forbidden resource: insufficient permissions');
    }

    return true;
  }
}
