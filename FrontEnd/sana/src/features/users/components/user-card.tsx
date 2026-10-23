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
  openMenuUpwards: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onAction: (action: UserAction, user: User) => void;
};

export default function UserCard({
  user,
  isMenuOpen,
  openMenuUpwards,
  onToggleMenu,
  onCloseMenu,
  onAction,
}: Props) {
  const avatarClass =
    user.status === "blocked"
      ? "bg-danger text-white"
      : user.status === "inactive"
        ? "bg-surface-muted text-text-subtle"
        : "bg-accent text-white";
  const nameClass =
    user.status === "blocked"
      ? "text-danger"
      : user.status === "inactive"
        ? "text-text-subtle"
        : "text-text";

  return (
    <li className="flex items-start gap-3 border-b border-border p-4 last:border-0">
      <span
        aria-hidden
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarClass}`}
      >
        {getInitials(user.fullName)}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${nameClass}`}>{user.fullName}</p>
        <p className="truncate text-xs text-text-muted">{user.email}</p>

        <div className="mt-3">
          <RoleTags roles={user.roles} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <UserStatusBadge status={user.status} />
          <span className="text-xs text-text-subtle">
            {formatRelativeDate(user.lastLoginAt)}
          </span>
        </div>
      </div>

      <div className="relative shrink-0">
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
      </div>
    </li>
  );
}