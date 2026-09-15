import { findRoleById } from "@/config/roles";
import type { AssignedRole } from "../types/user-types";

export default function RoleTags({ roles }: { roles: AssignedRole[] }) {
  if (roles.length === 0) {
    return <span className="text-xs text-text-subtle">Sin roles</span>;
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {roles.map((role) => {
        const definition = findRoleById(role.id);
        if (!definition) return null;

        return (
          <li
            key={role.id}
            title={
              role.isActive
                ? "Rol activo"
                : "Rol asignado pero apagado en este momento"
            }
            className={`rounded-md px-2.5 py-1 text-xs ${
              role.isActive
                ? "bg-primary-soft text-primary"
                : "bg-surface-muted text-text-subtle line-through"
            }`}
          >
            {definition.label}
          </li>
        );
      })}
    </ul>
  );
}