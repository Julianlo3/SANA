"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptScheduleTerms,
  getScheduleTermsStatus,
} from "../services/schedule-service";
import { acceptPsychologistTerms } from "../services/psychologist-terms-service";
import { getPolicyDocument } from "@/features/consultation-requests/services/policy-service";

type TermsStep = "psychologist" | "schedule";

/**
 * El psicólogo debe aceptar DOS términos distintos, en orden, antes de
 * poder usar su calendario:
 * 1. psychologist-terms (PATCH /auth/psychologist-terms) — términos
 *    generales de psicólogo, se aceptan una sola vez.
 * 2. schedule_terms (POST /schedule/me/accept-terms) — específico de la
 *    agenda. El backend rechaza crear bloqueos si falta cualquiera de
 *    los dos, aunque ya se haya aceptado el otro.
 */
export function useScheduleTerms(initialPsyTermsAccepted: boolean | null) {
  const [step, setStep] = useState<TermsStep | null>(
    initialPsyTermsAccepted ? null : "psychologist",
  );
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(
    initialPsyTermsAccepted ? null : false,
  );
  const [policyContent, setPolicyContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!initialPsyTermsAccepted) {
      // Falta el primer check; no hace falta consultar el de agenda todavía.
      setIsLoading(false);
      return;
    }

    getScheduleTermsStatus()
      .then((status) => {
        if (!isMounted) return;
        setHasAccepted(status.hasAccepted);
        if (!status.hasAccepted) setStep("schedule");
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("No pudimos cargar los términos. Intenta de nuevo.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialPsyTermsAccepted]);

  useEffect(() => {
    if (!step) return;

    let isMounted = true;
    const policyType = step === "psychologist" ? "schedule_terms" : "schedule_terms";

    getPolicyDocument(policyType).then((policy) => {
      if (isMounted) setPolicyContent(policy.pdContent);
    });

    return () => {
      isMounted = false;
    };
  }, [step]);

  const accept = useCallback(async () => {
    setIsAccepting(true);
    try {
      if (step === "psychologist") {
        await acceptPsychologistTerms();
        setStep("schedule");
      } else if (step === "schedule") {
        await acceptScheduleTerms();
        setHasAccepted(true);
        setStep(null);
      }
    } finally {
      setIsAccepting(false);
    }
  }, [step]);

  return {
    hasAccepted: step === null ? hasAccepted : false,
    policyContent,
    isLoading,
    loadError,
    isAccepting,
    accept,
  };
}