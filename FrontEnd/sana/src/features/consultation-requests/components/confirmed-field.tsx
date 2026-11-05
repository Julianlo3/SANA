"use client";

import TextField from "@/components/forms/text-field";

/**
 * Props for the confirmed field component.
 */
type Props = {
  label: string;
  confirmLabel: string;
  value: string;
  confirmValue: string;
  error?: string;
  confirmError?: string;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "email" | "tel" | "numeric";
  maxLength?: number;
  required?: boolean;
  onChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onBlur: () => void;
  onConfirmBlur: () => void;
};

/**
 * A field that requires the user to confirm the value by entering it twice. The second field prevents pasting for security reasons.
 * @param param0 an object containing the props for the component
 * @returns a React component that renders two text fields, one for the original value and one for the confirmation value
 */
export default function ConfirmedField({
  label,
  confirmLabel,
  value,
  confirmValue,
  error,
  confirmError,
  type = "text",
  inputMode = "text",
  maxLength,
  required = true,
  onChange,
  onConfirmChange,
  onBlur,
  onConfirmBlur,
}: Props) {
  return (
    <>
      <TextField
        label={label}
        required={required}
        type={type}
        inputMode={inputMode}
        value={value}
        error={error}
        maxLength={maxLength}
        onChange={onChange}
        onBlur={onBlur}
      />

      <TextField
        label={confirmLabel}
        required={required}
        type={type}
        inputMode={inputMode}
        value={confirmValue}
        error={confirmError}
        maxLength={maxLength}
        placeholder="Escríbelo de nuevo"
        hint="Por seguridad, escríbelo manualmente; no se permite pegar."
        preventPaste
        onChange={onConfirmChange}
        onBlur={onConfirmBlur}
      />
    </>
  );
}