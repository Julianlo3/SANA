import { useEffect, useEffectEvent, type RefObject } from "react";

/**
 * Defines the focusable.
 */
const FOCUSABLE = "button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

/**
 * Implements the trap tab operation.
 * @param event event input.
 * @param dialog dialog input.
 */
function trapTab(event: KeyboardEvent, dialog: HTMLElement) {
  const focusable = Array.from(
    dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
  ).filter((element) => element.getClientRects().length > 0);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  const active = document.activeElement;
  const isOutside = !dialog.contains(active);
  if (event.shiftKey && (active === first || isOutside)) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && (active === last || isOutside)) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Focus, Escape, Tab trapping and body scroll lock for a modal layer.
 * Only the active layer reacts to the keyboard, so dialogs can be stacked.
 * @param params Destructured operation parameters.
 */
export function useModalDialog({
  dialogRef,
  initialFocusRef,
  isActive = true,
  onClose,
  onKeyDown,
}: {
  dialogRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
  isActive?: boolean;
  onClose: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const dialog = dialogRef.current;
    if (!isActive || !dialog) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "Tab") {
      trapTab(event, dialog);
    } else {
      onKeyDown?.(event);
    }
  });

  useEffect(() => {
    initialFocusRef.current?.focus({ preventScroll: true });
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    window.addEventListener("keydown", listener);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", listener);
    };
  }, [initialFocusRef]);
}
