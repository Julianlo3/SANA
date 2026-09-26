"use client";

import { MoreVertical } from "lucide-react";
import { formatRelativeDate } from "@/lib/format/date-time";
import { getInitials } from "@/lib/format/text";
import RoleTags from "./role-tags";
import UserActionsMenu from "./user-actions-menu";
import UserStatusBadge from "./user-status-badge";
import type { User, UserAction } from "../types/user-types";

type Props = {
  user: User;
  isMenuOpen: boolean;
  /** Abre el menú hacia arriba cuando la fila está al final de la tabla. */
  openMenuUpwards: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onAction: (action: UserAction, user: User) => void;
};

export default function UserRow({
  user,
  isMenuOpen,
  openMenuUpwards,
  onToggleMenu,
  onCloseMenu,
  onAction,
}: Props) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-4 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
               className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
          >
            {getInitials(user.fullName)}
          </span>
          <span className="font-medium text-text">{user.fullName}</span>
        </div>
      </td>

      <td className="px-3 py-4 text-sm text-text-muted">{user.email}</td>

      <td className="px-3 py-4">
        <RoleTags roles={user.roles} />
      </td>

      <td className="px-3 py-4">
        <UserStatusBadge status={user.status} />
      </td>

      <td className="px-3 py-4 text-sm text-text-subtle">
        {formatRelativeDate(user.lastLoginAt)}
      </td>

      <td className="relative py-4 pl-3 pr-5 text-right">
        <button
          onClick={onToggleMenu}
          aria-label={`Acciones para ${user.fullName}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className="cursor-pointer rounded-lg p-2 text-text-subtle transition hover:bg-surface-muted hover:text-text"
        >
          <MoreVertical size={18} aria-hidden />
        </button>

        {isMenuOpen && (
          <UserActionsMenu
            user={user}
            openUpwards={openMenuUpwards}
            onClose={onCloseMenu}
            onSelect={(action) => onAction(action, user)}
          />
        )}
      </td>
    </tr>
  );
}