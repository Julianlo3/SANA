"use client";

import { ROLE_CATALOG } from "@/config/roles";

type Props = {
  selectedRoleIds: number[];
  onToggleRole: (roleId: number) => void;
  allowMultiple?: boolean;
  error?: string;
  disabled?: boolean;
  /** Roles asignados pero apagados. Solo se usa en la edición. */
  inactiveRoleIds?: number[];
  onToggleRoleActive?: (roleId: number) => void;
};

export default function RoleSelector({
  selectedRoleIds,
  onToggleRole,
  allowMultiple = true,
  error,
  disabled = false,
  inactiveRoleIds,
  onToggleRoleActive,
}: Props) {
  const showsActivation = Boolean(onToggleRoleActive);

  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-semibold text-text">
        Roles en la plataforma{" "}
        <span className="text-danger" aria-hidden>
          *
        </span>
      </legend>
      <p className="mt-1 text-xs text-text-subtle">
        {allowMultiple
          ? "Una persona puede tener varios roles a la vez."
          : "Selecciona el rol inicial de la persona."}
        {showsActivation &&
          " Puedes apagar un rol sin quitárselo, por ejemplo mientras está de vacaciones."}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {ROLE_CATALOG.map((role) => {
          const isAssigned = selectedRoleIds.includes(role.id);
          const isActive = !inactiveRoleIds?.includes(role.id);

          return (
            <div
              key={role.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                isAssigned
                  ? "border-primary/50 bg-primary-soft/50"
                  : "border-border"
              } ${disabled ? "opacity-60" : ""}`}
            >
              <input
                id={`role-${role.id}`}
                type={allowMultiple ? "checkbox" : "radio"}
                checked={isAssigned}
                onChange={() => onToggleRole(role.id)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
              />

              <label
                htmlFor={`role-${role.id}`}
                className="min-w-0 flex-1 cursor-pointer"
              >
                <span className="block text-sm text-text">{role.label}</span>
                <span className="block text-xs text-text-subtle">
                  {role.description}
                </span>
              </label>

              {showsActivation && isAssigned && (
                <button
                  type="button"
                  onClick={() => onToggleRoleActive?.(role.id)}
                  aria-pressed={isActive}
                  className={`shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed ${
                    isActive
                      ? "bg-success-soft text-success"
                      : "bg-surface-muted text-text-subtle"
                  }`}
                >
                  {isActive ? "Activo" : "Apagado"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <span role="alert" className="mt-2 block text-xs text-danger">
          {error}
        </span>
      )}
    </fieldset>
  );
}