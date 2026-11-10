/**
 * Catalog of roles assignable by administrators.
 *
 * IDs and names mirror `public.rol` seed data. The requester role is omitted
 * because requesters register through the public appointment form. The backend
 * database remains authoritative; this catalog is a frontend fallback.
 */

export type RoleDefinition = {
  id: number;
  /** Database role description returned in the session roles array. */
  name: string;
  label: string;
  description: string;
  /** Indicates whether the role requires psychologist-specific data. */
  requiresProfessionalData: boolean;
};

/**
 * Defines role catalog.
 */
export const ROLE_CATALOG: RoleDefinition[] = [
  {
    id: 4,
    name: "administrador",
    label: "Administrador",
    description: "Gestiona cuentas, roles y la configuración de la plataforma.",
    requiresProfessionalData: false,
  },
  {
    id: 1,
    name: "secretario",
    label: "Asistente administrativa",
    description: "Agenda citas y atiende a las familias que llegan.",
    requiresProfessionalData: false,
  },
  {
    id: 5,
    name: "psicologo",
    label: "Psicólogo",
    description: "Atiende las citas y registra las atenciones.",
    requiresProfessionalData: true,
  },
  {
    id: 2,
    name: "marketing",
    label: "Marketing y diseño",
    description: "Publica contenido, eventos y campañas de la fundación.",
    requiresProfessionalData: false,
  },
];

/**
 * Finds role by id.
 * @param id Resource identifier.
 * @returns Result of the operation.
 */

export function findRoleById(id: number): RoleDefinition | undefined {
  return ROLE_CATALOG.find((role) => role.id === id);
}

/**
 * Finds role by name.
 * @param name Name value.
 * @returns Result of the operation.
 */

export function findRoleByName(name: string): RoleDefinition | undefined {
  return ROLE_CATALOG.find((role) => role.name === name);
}

/**
 * Determines whether professional data is required.
 * @param roleIds Role values used by the operation.
 * @returns Whether the condition is satisfied.
 */

export function requiresProfessionalData(roleIds: number[]): boolean {
  return roleIds.some((id) => findRoleById(id)?.requiresProfessionalData);
}

/**
 * Maps raw session role names to user-facing labels.
 * @param roleNames Role values used by the operation.
 * @returns Result of the operation.
 */
/**
 * Formats session roles as user-facing labels.
 * @param roleNames Raw role names from the session.
 * @returns Comma-separated role labels.
 */
export function formatRoleLabels(roleNames: string[]): string {
  const labels = roleNames
    .map((name) => findRoleByName(name)?.label)
    .filter((label): label is string => Boolean(label));

  return labels.length > 0 ? labels.join(" · ") : "Sin rol asignado";
}