"use client";

import { useId } from "react";

type Props = {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
};

export default function TextAreaField({
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  rows = 4,
  maxLength,
  required = false,
  disabled = false,
}: Props) {
  const inputId = useId();
  const messageId = `${inputId}-message`;

  return (
    <div className="block">
      <label
        htmlFor={inputId}
        className="flex items-center gap-2 text-sm font-semibold text-text"
      >
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            *
          </span>
        )}
      </label>

      <textarea
        id={inputId}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={onBlur}
        className={`mt-2 w-full resize-y rounded-xl border px-4 py-3 text-sm text-text transition placeholder:text-text-subtle focus:outline-none focus:ring-2 ${
          disabled
            ? "cursor-not-allowed border-border bg-surface-muted text-text-subtle"
            : "bg-surface"
        } ${
          error
            ? "border-danger focus:ring-danger/40"
            : "border-border focus:ring-primary/40"
        }`}
      />

      <div className="mt-1.5 flex justify-between gap-3 text-xs">
        {error || hint ? (
          <span
            id={messageId}
            role={error ? "alert" : undefined}
            className={error ? "text-danger" : "text-text-subtle"}
          >
            {error ?? hint}
          </span>
        ) : (
          <span />
        )}
        {maxLength && (
          <span className="shrink-0 tabular-nums text-text-subtle">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
