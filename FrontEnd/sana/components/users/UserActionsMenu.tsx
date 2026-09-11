"use client";

import { useEffect, useRef } from "react";
import { Pencil, Ban, UserMinus, UserCheck, Trash2 } from "lucide-react";
import type { User } from "@/lib/mocks/users";

export type UserAction = "edit" | "block" | "deactivate" | "reactivate" | "delete";

type Props = {
  user: User;
  onSelect: (action: UserAction) => void;
  onClose: () => void;
};

export default function UserActionsMenu({ user, onSelect, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const isBlocked = user.status === "blocked";
  const isInactive = user.status === "inactive";

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border/60 bg-surface-raised py-1 shadow-xl"
    >
      <button
        role="menuitem"
        onClick={() => onSelect("edit")}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-text-muted transition hover:bg-surface hover:text-text"
      >
        <Pencil size={15} />
        Editar perfil
      </button>

      {isBlocked || isInactive ? (
        <button
          role="menuitem"
          onClick={() => onSelect("reactivate")}
          className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-accent transition hover:bg-surface"
        >
          <UserCheck size={15} />
          Reactivar acceso
        </button>
      ) : (
        <>
          <button
            role="menuitem"
            onClick={() => onSelect("block")}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-text-muted transition hover:bg-surface hover:text-text"
          >
            <Ban size={15} />
            Bloquear usuario
          </button>

          <button
            role="menuitem"
            onClick={() => onSelect("deactivate")}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-text-muted transition hover:bg-surface hover:text-text"
          >
            <UserMinus size={15} />
            Desactivar cuenta
          </button>
        </>
      )}

      <div className="my-1 h-px bg-border/50" />

      <button
        role="menuitem"
        onClick={() => onSelect("delete")}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
      >
        <Trash2 size={15} />
        Eliminar usuario
      </button>
    </div>
  );
}