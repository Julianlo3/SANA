import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
export const ROLES_KEY = 'roles';
/**
 * Guard that checks if the authenticated user has the required roles to access a route.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Checks if the authenticated user has the required roles to access a route.
   * @param context The execution context.
   * @returns A boolean indicating if the user has the required roles.
   */
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) return true;
    const user = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>().user;
    return roles.some((role) => user.roles.includes(role));
  }
}
