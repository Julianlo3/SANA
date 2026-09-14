"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
}: Props) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-2xl"
      >
        <div className="flex items-start gap-4 p-6 pb-4">
          {icon}

          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-text">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-xs uppercase tracking-wider text-text-subtle">
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="cursor-pointer rounded-lg p-1 text-text-subtle transition hover:bg-surface-raised hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 text-sm leading-relaxed text-text-muted">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-3 border-t border-border/40 bg-surface-raised/40 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}