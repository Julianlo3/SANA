"use client";

import { useEffect, useState } from "react";
import { DATA_POLICY } from "@/config/data-policy";
import { getPolicyDocument, type PolicyType } from "../services/policy-service";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  /** Qué política mostrar: data_treatment (adulto) o dependent_consent (tutor/menor). */
  policyType?: PolicyType;
  /** Texto de respaldo si el backend no responde, o para casos sin policyType. */
  label?: string;
};

/**
 * Muestra el texto real de la política, traído de GET /policy/:type
 * (HU-2.2.6 y HU-2.2.8). Si la petición falla o no se da policyType, usa
 * el texto de respaldo de DATA_POLICY para no bloquear el envío.
 */
export default function DataPolicyConsent({
  checked,
  onChange,
  error,
  policyType,
  label,
}: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!policyType) return;

    let isMounted = true;

    getPolicyDocument(policyType)
      .then((document) => {
        if (isMounted) {
          setContent(document.pdContent);
          setVersion(document.pdVersion);
        }
      })
      .catch(() => {
        // Se queda con el texto de respaldo; no bloquea el formulario.
      });

    return () => {
      isMounted = false;
    };
  }, [policyType]);

  const displayLabel = content ?? label ?? DATA_POLICY.consentLabel;

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
          {displayLabel}
          {version && (
            <span className="ml-1 text-text-subtle">(versión {version})</span>
          )}
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