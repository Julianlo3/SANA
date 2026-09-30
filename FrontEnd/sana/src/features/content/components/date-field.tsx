"use client";

import { useId } from "react";

export default function DateField({
  label,
  value,
  onChange,
  error,
  min,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  min?: string;
  disabled?: boolean;
}) {
  const inputId = useId();

  return (
    <div className="block">
      <label htmlFor={inputId} className="text-sm font-semibold text-text">
        {label}
      </label>
      <input
        id={inputId}
        type="date"
        value={value}
        min={min}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 w-full rounded-xl border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-muted ${
          error ? "border-danger focus:ring-danger/40" : "border-border focus:ring-primary/40"
        }`}
      />
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
