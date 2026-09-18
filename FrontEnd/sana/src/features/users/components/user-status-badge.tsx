import type { UserStatus } from "../types/user-types";

const STATUS_STYLES: Record<UserStatus, string> = {
  active: "bg-success-soft text-success",
  inactive: "bg-surface-muted text-text-subtle",
  blocked: "bg-danger-soft text-danger",
  pending: "bg-surface-muted text-text-subtle",
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  blocked: "Bloqueado",
  pending: "Pendiente",
};

export default function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}