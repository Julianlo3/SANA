"use client";

import { Search, Bell, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center gap-4 border-b border-border/40 px-8 py-4">
      <div className="relative max-w-md flex-1">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle"
        />
        <input
          type="search"
          placeholder="Buscar usuario o solicitud..."
          className="w-full rounded-full bg-surface py-3 pl-12 pr-4 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button className="cursor-pointer text-text-muted hover:text-text">
          <Bell size={20} />
        </button>
        <button className="cursor-pointer text-text-muted hover:text-text">
          <Settings size={20} />
        </button>
        <div className="h-6 w-px bg-border" />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-background">
          AS
        </div>
      </div>
    </header>
  );
}