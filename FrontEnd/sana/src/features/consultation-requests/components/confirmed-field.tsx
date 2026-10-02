"use client";

import TextField from "@/components/forms/text-field";

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
 * Un campo + su confirmación ("escríbelo de nuevo"), uno debajo del otro.
 * Pedido del cliente (30/09): documento y correo se confirman dos veces,
 * en los dos formularios públicos.
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
        onChange={onConfirmChange}
        onBlur={onConfirmBlur}
      />
    </>
  );
}