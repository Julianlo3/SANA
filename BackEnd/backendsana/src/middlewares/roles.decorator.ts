import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/roles.guard.js';
/**
 * A decorator that sets the required roles for a route.
 * @param roles The roles required to access the route.
 * @returns A function that sets the metadata for the route.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
