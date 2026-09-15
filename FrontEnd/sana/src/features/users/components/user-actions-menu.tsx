"use client";

import { useEffect, useRef } from "react";
import { Ban, Pencil, Trash2, UserCheck, UserMinus } from "lucide-react";
import type { User, UserAction } from "../types/user-types";

type Props = {
  user: User;
  onSelect: (action: UserAction) => void;
  onClose: () => void;
  /**
   * Abre el menú hacia arriba. Se usa en las últimas filas para que el panel
   * no se salga del área visible ni tape el pie del listado.
   */
  openUpwards?: boolean;
};

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition";

export default function UserActionsMenu({
  user,
  onSelect,
  onClose,
  openUpwards = false,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
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

  const canReactivate = user.status !== "active";

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Acciones para ${user.fullName}`}
      className={`absolute right-0 z-50 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 text-left shadow-lg ${
        openUpwards ? "bottom-full mb-1" : "top-full mt-1"
      }`}
    >
      <button
        role="menuitem"
        onClick={() => onSelect("edit")}
        className={`${ITEM_CLASS} text-text-muted hover:bg-surface-muted hover:text-text`}
      >
        <Pencil size={15} aria-hidden />
        Editar información
      </button>

      {canReactivate ? (
        <button
          role="menuitem"
          onClick={() => onSelect("reactivate")}
          className={`${ITEM_CLASS} font-semibold text-primary hover:bg-primary-soft`}
        >
          <UserCheck size={15} aria-hidden />
          Reactivar acceso
        </button>
      ) : (
        <>
          <button
            role="menuitem"
            onClick={() => onSelect("block")}
            className={`${ITEM_CLASS} text-text-muted hover:bg-surface-muted hover:text-text`}
          >
            <Ban size={15} aria-hidden />
            Bloquear acceso
          </button>

          <button
            role="menuitem"
            onClick={() => onSelect("deactivate")}
            className={`${ITEM_CLASS} text-text-muted hover:bg-surface-muted hover:text-text`}
          >
            <UserMinus size={15} aria-hidden />
            Desactivar cuenta
          </button>
        </>
      )}

      <div className="my-1 h-px bg-border" role="separator" />

      <button
        role="menuitem"
        onClick={() => onSelect("delete")}
        className={`${ITEM_CLASS} text-danger hover:bg-danger-soft`}
      >
        <Trash2 size={15} aria-hidden />
        Eliminar usuario
      </button>
    </div>
  );
}