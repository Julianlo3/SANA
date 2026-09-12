"use client";

import { MoreVertical } from "lucide-react";
import UserActionsMenu, { type UserAction } from "./UserActionsMenu";
import type { User, UserStatus } from "@/lib/mocks/users";

const statusStyles: Record<UserStatus, string> = {
  active: "bg-success-soft text-success",
  inactive: "bg-surface-muted text-text-subtle",
  blocked: "bg-danger-soft text-danger",
};

const statusLabels: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  blocked: "Bloqueado",
};

type Props = {
  user: User;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onAction: (action: UserAction, user: User) => void;
};

export default function UserRow({
  user,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onAction,
}: Props) {
  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  const roleTags = (
    <div className="flex flex-wrap gap-1.5">
      {user.roles.map((role) => (
        <span
          key={role.id}
          title={role.active ? "Rol activo" : "Rol desactivado"}
          className={`rounded-md px-2.5 py-1 text-xs ${
            role.active
              ? "bg-primary-soft text-primary"
              : "bg-surface-muted text-text-subtle line-through"
          }`}
        >
          {role.name}
        </span>
      ))}
    </div>
  );

  const statusTag = (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[user.status]}`}
    >
      {statusLabels[user.status]}
    </span>
  );

  const actionsButton = (
    <>
      <button
        onClick={onToggleMenu}
        aria-label={`Acciones para ${user.fullName}`}
        aria-expanded={menuOpen}
        className="cursor-pointer rounded-lg p-2 text-text-subtle transition hover:bg-surface-muted hover:text-text"
      >
        <MoreVertical size={18} />
      </button>

      {menuOpen && (
        <UserActionsMenu
          user={user}
          onClose={onCloseMenu}
          onSelect={(action) => onAction(action, user)}
        />
      )}
    </>
  );

  return (
    <>
      <tr className="hidden border-b border-border last:border-0 lg:table-row">
        <td className="py-4 pl-5 pr-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="font-medium text-text">{user.fullName}</span>
          </div>
        </td>

        <td className="px-3 py-4 text-sm text-text-muted">{user.email}</td>
        <td className="px-3 py-4">{roleTags}</td>
        <td className="px-3 py-4">{statusTag}</td>
        <td className="px-3 py-4 text-sm text-text-subtle">
          {user.lastLoginAt}
        </td>
        <td className="relative py-4 pl-3 pr-5 text-right">{actionsButton}</td>
      </tr>

      <tr className="lg:hidden">
        <td colSpan={6} className="block border-b border-border p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text">{user.fullName}</p>
              <p className="truncate text-xs text-text-muted">{user.email}</p>

              <div className="mt-3">{roleTags}</div>

              <div className="mt-3 flex items-center gap-3">
                {statusTag}
                <span className="text-xs text-text-subtle">
                  {user.lastLoginAt}
                </span>
              </div>
            </div>

            <div className="relative shrink-0">{actionsButton}</div>
          </div>
        </td>
      </tr>
    </>
  );
}