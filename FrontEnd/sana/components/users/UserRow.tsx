"use client";

import { MoreVertical } from "lucide-react";
import type { User, UserStatus } from "@/lib/mocks/users";

const statusStyles: Record<UserStatus, string> = {
  active: "bg-accent/15 text-accent",
  inactive: "bg-text-subtle/15 text-text-subtle",
  blocked: "bg-red-500/15 text-red-400",
};

const statusLabels: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  blocked: "Bloqueado",
};

type Props = {
  user: User;
  onAction: (user: User) => void;
};

export default function UserRow({ user, onAction }: Props) {
  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return (
    <tr className="border-b border-border/30 last:border-0">
      <td className="py-4 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-dark text-xs font-semibold text-white">
            {initials}
          </div>
          <span className="font-medium text-text">{user.fullName}</span>
        </div>
      </td>

      <td className="px-3 py-4 text-sm text-text-muted">{user.email}</td>

      <td className="px-3 py-4">
        <span className="rounded-md bg-surface-raised px-2.5 py-1 text-xs text-text-muted">
          {user.role}
        </span>
      </td>

      <td className="px-3 py-4">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[user.status]}`}
        >
          {statusLabels[user.status]}
        </span>
      </td>

      <td className="px-3 py-4 text-sm text-text-subtle">{user.lastLoginAt}</td>

      <td className="py-4 pl-3 pr-5 text-right">
        <button
          onClick={() => onAction(user)}
          aria-label={`Acciones para ${user.fullName}`}
          className="cursor-pointer rounded-lg p-2 text-text-subtle transition hover:bg-surface-raised hover:text-text"
        >
          <MoreVertical size={18} />
        </button>
      </td>
    </tr>
  );
}