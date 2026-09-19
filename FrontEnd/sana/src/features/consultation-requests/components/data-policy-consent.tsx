"use client";

import Link from "next/link";
import { REQUEST_CONTENT } from "@/content/consultation-request";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

/**
 * Autorización de tratamiento de datos (HU-2.2.6).
 * Sin marcarla no se puede enviar la solicitud.
 */
export default function DataPolicyConsent({
  checked,
  onChange,
  error,
}: Props) {
  const { dataPolicy } = REQUEST_CONTENT;

  return (
    <div>
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
          error ? "border-danger bg-danger-soft/40" : "border-border bg-surface"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
        />

        <span className="text-xs leading-relaxed text-text-muted">
          {dataPolicy.label}{" "}
          <span className="text-danger" aria-hidden>
            *
          </span>
          <Link
            href={dataPolicy.url}
            target="_blank"
            className="mt-1 block font-semibold text-primary hover:underline"
          >
            {dataPolicy.linkLabel}
          </Link>
        </span>
      </label>

      {error && (
        <span role="alert" className="mt-2 block text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}