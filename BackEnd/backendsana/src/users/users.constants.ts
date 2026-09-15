import { UserRole } from '../models/user-role.enum.js';

/**
 * Roles asignables a una cuenta del sistema (personal de la fundacion).
 * `consultante` y `pendiente` no aplican: no tienen cuenta administrada aqui.
 * Debe mantenerse igual a `ALLOWED_ROLES` en auth.service.ts.
 */
export const ASSIGNABLE_ROLES: readonly UserRole[] = [
  UserRole.Administrator,
  UserRole.Secretary,
  UserRole.Psychologist,
  UserRole.Marketing,
];
