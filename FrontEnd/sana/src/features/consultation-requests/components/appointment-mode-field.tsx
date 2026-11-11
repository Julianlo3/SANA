"use client";

import { allowsInPersonAppointments } from "@/config/residence-zones";
import type { AppointmentMode } from "../types/consultation-request-types";

/**
 * Defines the appointment mode options.
 */
const APPOINTMENT_MODE_OPTIONS: { value: AppointmentMode; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
];

/**
 * Defines the props type.
 */
type Props = {
  /** Current residence department; omit outside the public request flow. */
  department?: string;
  value: AppointmentMode | "";
  error?: string;
  onChange: (value: AppointmentMode | "") => void;
  onBlur: () => void;
};

/**
 * Appointment mode selector shared by both public request forms.
 * @param props Component properties.
 */
export default function AppointmentModeField({
  department,
  value,
  error,
  onChange,
  onBlur,
}: Props) {
  const canChooseInPerson =
    department === undefined || allowsInPersonAppointments(department);
  const availableOptions = canChooseInPerson
    ? APPOINTMENT_MODE_OPTIONS
    : APPOINTMENT_MODE_OPTIONS.filter((option) => option.value === "virtual");

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
        {availableOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {!canChooseInPerson && (
        <span className="mt-1.5 block text-xs text-text-subtle">
          La atención presencial solo está disponible para residentes del
          departamento del Huila.
        </span>
      )}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}