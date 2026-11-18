"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import DataPolicyConsent from "@/features/consultation-requests/components/data-policy-consent";
import { acceptAccountTerms } from "../services/account-terms-service";

/**
 * Defines the props type.
 */
type Props = {
  readonly termsAccepted: boolean;
  readonly children: ReactNode;
};

/**
 * Renders a gate that requires the user to accept the account terms before accessing the children components. If the terms have already been accepted, it renders the children directly. Otherwise, it displays a form for accepting the terms.
 * @param param0 The props object containing the termsAccepted boolean and the children ReactNode.
 * @returns The JSX element representing the account terms gate.
 */
export default function AccountTermsGate({ termsAccepted, children }: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(termsAccepted);

  if (accepted) return children;

  const submit = async () => {
    setWasSubmitted(true);
    if (!checked) return;

    setIsSaving(true);
    setSubmitError(null);
    try {
      await acceptAccountTerms();
      setAccepted(true);
      router.refresh();
    } catch {
      setSubmitError("No pudimos guardar tu aceptación. Intenta de nuevo en unos minutos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <ShieldCheck size={20} aria-hidden />
        </div>
        <h1 className="font-display text-xl font-bold text-primary-dark">
          Antes de continuar
        </h1>
      </div>

      <p className="mt-4 text-sm text-text-muted">
        Para usar tu cuenta necesitamos que aceptes las condiciones de uso de SANA.
      </p>

      <div className="mt-5">
        <DataPolicyConsent
          checked={checked}
          onChange={setChecked}
          error={wasSubmitted && !checked ? "Debes aceptar para continuar." : undefined}
          policyType="account_terms"
          disabled={isSaving}
        />
      </div>

      {submitError && (
        <div className="mt-4">
          <InlineMessage tone="error">{submitError}</InlineMessage>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={submit} disabled={isSaving}>
          {isSaving ? "Guardando…" : "Aceptar y continuar"}
        </Button>
      </div>
    </section>
  );
}
