"use client";

import type { AppointmentMode } from "../types/consultation-request-types";

const APPOINTMENT_MODE_OPTIONS: { value: AppointmentMode; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
];

type Props = {
  value: AppointmentMode | "";
  error?: string;
  onChange: (value: AppointmentMode | "") => void;
  onBlur: () => void;
};

/** Selector de modalidad de la cita, compartido entre los dos formularios públicos. */
export default function AppointmentModeField({
  value,
  error,
  onChange,
  onBlur,
}: Props) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-text">
        Modalidad de la cita{" "}
        <span className="text-danger" aria-hidden>
          *
        </span>
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as AppointmentMode | "")}
        onBlur={onBlur}
        className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">Selecciona</option>
        {APPOINTMENT_MODE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}