"use client";

import { useId } from "react";
import { Lock } from "lucide-react";

type Props = {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "email" | "numeric" | "tel";
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  /** Muestra el candado: el dato no se puede cambiar nunca desde esta pantalla. */
  locked?: boolean;
};

export default function TextField({
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  type = "text",
  inputMode = "text",
  maxLength,
  required = false,
  disabled = false,
  locked = false,
}: Props) {
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const isReadOnly = disabled || locked;

  return (
    <div className="block">
      <label
        htmlFor={inputId}
        className={`flex items-center gap-2 text-sm font-semibold ${
          locked ? "text-text-subtle" : "text-text"
        }`}
      >
        {locked && <Lock size={14} aria-hidden />}
        {label}
        {required && !locked && (
          <span className="text-danger" aria-hidden>
            *
          </span>
        )}
      </label>

      <input
        id={inputId}
        type={type}
        inputMode={inputMode}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={isReadOnly}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={onBlur}
        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-text transition placeholder:text-text-subtle focus:outline-none focus:ring-2 ${
          isReadOnly
            ? "cursor-not-allowed border-border bg-surface-muted text-text-subtle"
            : "bg-surface"
        } ${
          error
            ? "border-danger focus:ring-danger/40"
            : "border-border focus:ring-primary/40"
        }`}
      />

      {(error || hint) && (
        <span
          id={messageId}
          role={error ? "alert" : undefined}
          className={`mt-1.5 block text-xs ${
            error ? "text-danger" : "text-text-subtle"
          }`}
        >
          {error ?? hint}
        </span>
      )}
    </div>
  );
}