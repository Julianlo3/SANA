"use client";

import { useEffect, useState } from "react";
import LegalLinksText, { mentionsPrivacyPolicy } from "@/components/legal/legal-links-text";
import { DATA_POLICY } from "@/config/data-policy";
import { getPolicyDocument, type PolicyType } from "../services/policy-service";

/**
 * Defines the props type.
 */
type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  /** Policy type used to fetch the current consent text. */
  policyType?: PolicyType;
  /**
   * Approved consent text recorded under a different policy type.
   * When provided, no policy request is made.
   */
  label?: string;
  disabled?: boolean;
};

/**
 * Defines the load state type.
 */
type LoadState =
  | { status: "loading" }
  | { status: "ready"; content: string }
  | { status: "error" };

/**
 * Renders a consent checkbox with its short text and a link to the full policy.
 * The policy document opens in a new tab and is not embedded in the form.
 * @param props Component properties.
 */
export default function DataPolicyConsent({
  checked,
  onChange,
  error,
  policyType,
  label,
  disabled = false,
}: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (label || !policyType) return;

    const controller = new AbortController();

    getPolicyDocument(policyType, controller.signal)
      .then((document) => setState({ status: "ready", content: document.content }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });

    return () => controller.abort();
  }, [label, policyType]);

  const text = label ?? (state.status === "ready" ? state.content : null);
  const unavailable = !label && state.status === "error";
  const placeholder = unavailable
    ? DATA_POLICY.unavailableLabel
    : DATA_POLICY.loadingLabel;

  return (
    <div>
      <label
        className={`flex items-start gap-3 rounded-xl border p-4 transition ${
          text ? "cursor-pointer" : "cursor-not-allowed"
        } ${error ? "border-danger bg-danger-soft/40" : "border-border bg-surface"}`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled || !text}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
        />

        <span className="text-xs leading-relaxed text-text-muted">
          {text ? <LegalLinksText text={text} /> : placeholder}
          {!(text && mentionsPrivacyPolicy(text)) && (
            <>
              {" "}
              <a
                href={DATA_POLICY.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
              >
                {DATA_POLICY.linkLabel}
              </a>
            </>
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
