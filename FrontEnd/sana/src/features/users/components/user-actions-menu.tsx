"use client";

import { useEffect, useRef } from "react";
import { Archive, Pencil, UserCheck, UserMinus } from "lucide-react";
import type { User, UserAction } from "../types/user-types";

/**
 * Defines the props type.
 */
type Props = {
  user: User;
  onSelect: (action: UserAction) => void;
  onClose: () => void;
  /**
   * Opens the menu upward near the bottom of the list to keep it within the
   * visible area and above the list footer.
   */
  openUpwards?: boolean;
};

/**
 * Defines the item class.
 */
const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition";

/**
 * Renders the user actions menu component.
 * @param props Component properties.
 * @returns Rendered component.
 */
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

      {user.status === "inactive" && (
        <button
          role="menuitem"
          onClick={() => onSelect("enable")}
          className={`${ITEM_CLASS} font-semibold text-primary hover:bg-primary-soft`}
        >
          <UserCheck size={15} aria-hidden />
          Habilitar cuenta
        </button>
      )}

      {user.status === "active" && (
        <button
          role="menuitem"
          onClick={() => onSelect("deactivate")}
          className={`${ITEM_CLASS} text-text-muted hover:bg-surface-muted hover:text-text`}
        >
          <UserMinus size={15} aria-hidden />
          Desactivar cuenta
        </button>
      )}

      {user.status !== "blocked" && (
        <>
          <div className="my-1 h-px bg-border" role="separator" />
          <button
            role="menuitem"
            onClick={() => onSelect("delete")}
            className={`${ITEM_CLASS} text-danger hover:bg-danger-soft`}
          >
            <Archive size={15} aria-hidden />
            Eliminar usuario
          </button>
        </>
      )}
    </div>
  );
}
