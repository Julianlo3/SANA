"use client";

import { useId } from "react";
import {
  NO_ZONE_REPORTED_LABEL,
  RESIDENCE_ZONES,
  formatZone,
} from "@/config/residence-zones";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

/**
 * Selector de zona de residencia (HU-2.2.5).
 * Admite dejarlo sin indicar: en ese caso la solicitud se registra igual.
 */
export default function ResidenceZoneSelect({
  label,
  value,
  onChange,
  disabled = false,
}: Props) {
  const selectId = useId();

  return (
    <div className="block">
      <label
        htmlFor={selectId}
        className="block text-sm font-semibold text-text"
      >
        {label}
      </label>

      <select
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text transition focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-surface-muted"
      >
        <option value="">{NO_ZONE_REPORTED_LABEL}</option>

        {RESIDENCE_ZONES.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {formatZone(zone)}
          </option>
        ))}
      </select>

      <span className="mt-1.5 block text-xs text-text-subtle">
        Si prefieres no indicarla, deja la opción “{NO_ZONE_REPORTED_LABEL}”.
      </span>
    </div>
  );
}