"use client";

import { useEffect, useRef } from "react";
import { Pencil, Ban, UserMinus, UserCheck, Trash2 } from "lucide-react";
import type { User } from "@/lib/mocks/users";

export type UserAction =
  | "edit"
  | "block"
  | "deactivate"
  | "reactivate"
  | "delete";

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

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const isBlocked = user.status === "blocked";
  const isInactive = user.status === "inactive";

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 text-left shadow-lg"
    >
      <button
        role="menuitem"
        onClick={() => onSelect("edit")}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-text-muted transition hover:bg-surface-muted hover:text-text"
      >
        <Pencil size={15} />
        Editar perfil
      </button>

      {isBlocked || isInactive ? (
        <button
          role="menuitem"
          onClick={() => onSelect("reactivate")}
          className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
        >
          <UserCheck size={15} />
          Reactivar acceso
        </button>
      ) : (
        <>
          <button
            role="menuitem"
            onClick={() => onSelect("block")}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-text-muted transition hover:bg-surface-muted hover:text-text"
          >
            <Ban size={15} />
            Bloquear usuario
          </button>

          <button
            role="menuitem"
            onClick={() => onSelect("deactivate")}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-text-muted transition hover:bg-surface-muted hover:text-text"
          >
            <UserMinus size={15} />
            Desactivar cuenta
          </button>
        </>
      )}

      <div className="my-1 h-px bg-border" />

      <button
        role="menuitem"
        onClick={() => onSelect("delete")}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-danger transition hover:bg-danger-soft"
      >
        <Trash2 size={15} />
        Eliminar usuario
      </button>
    </div>
  );
}