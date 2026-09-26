"use client";

import { LogOut } from "lucide-react";
import { PANEL_CONTENT } from "@/content/panel";
import { formatRoleLabels } from "@/config/roles";
import { getInitials } from "@/lib/format/text";

type Props = {
  fullName: string;
  roles: string[];
};

export default function PanelHeader({ fullName, roles }: Props) {
  return (
    <header className="flex items-center gap-4 border-b border-border px-8 py-4">
      <p className="truncate text-sm text-text-muted">
        {PANEL_CONTENT.organizationName}
      </p>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <p className="truncate text-sm font-semibold text-text">
            {fullName}
          </p>
          <p className="truncate text-xs text-text-subtle">
            {formatRoleLabels(roles)}
          </p>
        </div>

        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
        >
          {getInitials(fullName)}
        </span>

        
        <a
          href="/auth/logout"
          aria-label={PANEL_CONTENT.signOut}
          className="cursor-pointer rounded-lg p-2 text-text-subtle transition hover:bg-surface-muted hover:text-text"
        >
          <LogOut size={18} aria-hidden />
        </a>
      </div>
    </header>
  );
}