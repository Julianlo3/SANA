/**
 * Catálogo de roles que el administrador puede asignar desde el panel.
 *
 * Los ids salen de DataBase/init-scripts/02-inserts.sql (tabla public.rol).
 * El id 3 (consultante) no está aquí porque esa persona se registra desde el
 * formulario público de solicitud de cita, no la crea el administrador.
 *
 * Este arreglo es el respaldo mientras el backend expone GET /roles: la fuente
 * de verdad es la base de datos, no el frontend.
 */

export type RoleDefinition = {
  id: number;
  label: string;
  description: string;
  /** Exige los datos extra de la tabla public.psychologist. */
  requiresProfessionalData: boolean;
};

export const ROLE_CATALOG: RoleDefinition[] = [
  {
    id: 4,
    label: "Administrador",
    description: "Gestiona cuentas, roles y la configuración de la plataforma.",
    requiresProfessionalData: false,
  },
  {
    id: 1,
    label: "Asistente administrativa",
    description: "Agenda citas y atiende a las familias que llegan.",
    requiresProfessionalData: false,
  },
  {
    id: 5,
    label: "Psicólogo",
    description: "Atiende las citas y registra las atenciones.",
    requiresProfessionalData: true,
  },
  {
    id: 2,
    label: "Marketing y diseño",
    description: "Publica contenido, eventos y campañas de la fundación.",
    requiresProfessionalData: false,
  },
];

export function findRoleById(id: number): RoleDefinition | undefined {
  return ROLE_CATALOG.find((role) => role.id === id);
}

export function requiresProfessionalData(roleIds: number[]): boolean {
  return roleIds.some((id) => findRoleById(id)?.requiresProfessionalData);
}