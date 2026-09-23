"use client";

import Link from "next/link";
import { DATA_POLICY } from "@/config/data-policy";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  label?: string;
};

export default function DataPolicyConsent({
  checked,
  onChange,
  error,
  label = DATA_POLICY.consentLabel,
}: Props) {
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
          {label}{" "}
          <span className="text-danger" aria-hidden>
            *
          </span>
          <Link
            href={DATA_POLICY.url}
            target="_blank"
            className="mt-1 block font-semibold text-primary hover:underline"
          >
            {DATA_POLICY.linkLabel}
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