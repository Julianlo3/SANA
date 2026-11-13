import type { UserStatus } from "../types/user-types";

/**
 * Defines the status styles.
 */
const STATUS_STYLES: Record<UserStatus, string> = {
  active: "bg-success-soft text-success",
  inactive: "bg-surface-muted text-text-subtle",
  blocked: "bg-danger-soft text-danger",
  pending: "bg-surface-muted text-text-subtle",
};

/**
 * Defines the status labels.
 */
const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  blocked: "Bloqueado",
  pending: "Pendiente",
};

/**
 * Renders the user status badge component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}