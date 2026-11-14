"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptScheduleTerms,
  getScheduleTermsStatus,
} from "../services/schedule-service";
import { acceptPsychologistTerms } from "../services/psychologist-terms-service";
import { getPolicyDocument } from "@/features/consultation-requests/services/policy-service";

/**
 * Defines the terms step type.
 */
type TermsStep = "psychologist" | "schedule";

/**
 * Coordinates acceptance of the psychologist's schedule terms.
 * @param initialPsyTermsAccepted Whether the user profile reports prior acceptance.
 * @returns Acceptance state, policy content, error state, and acceptance handler.
 */
export function useScheduleTerms(initialPsyTermsAccepted: boolean | null) {
  const [step, setStep] = useState<TermsStep | null>(
    initialPsyTermsAccepted ? null : "psychologist",
  );
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(
    initialPsyTermsAccepted ? null : false,
  );
  const [policyContent, setPolicyContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(initialPsyTermsAccepted));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!initialPsyTermsAccepted) return;

    let isMounted = true;

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

    getPolicyDocument("schedule_terms").then((policy) => {
      if (isMounted) setPolicyContent(policy.content);
    });

    return () => {
      isMounted = false;
    };
  }, [step]);

  /**
   * Accepts the required terms and updates the calendar gate immediately.
   * @returns A promise that resolves when acceptance finishes.
   */
  const accept = useCallback(async () => {
    setIsAccepting(true);
    setAcceptError(null);
    try {
      if (step === "psychologist") {
        await acceptPsychologistTerms();
        // This endpoint records schedule_terms acceptance, so the calendar can open immediately.
        setHasAccepted(true);
        setStep(null);
      } else if (step === "schedule") {
        await acceptScheduleTerms();
        setHasAccepted(true);
        setStep(null);
      }
    } catch {
      setAcceptError("No pudimos guardar tu aceptación. Intenta de nuevo.");
    } finally {
      setIsAccepting(false);
    }
  }, [step]);

  return {
    hasAccepted: step === null ? hasAccepted : false,
    policyContent,
    isLoading,
    loadError,
    acceptError,
    isAccepting,
    accept,
  };
}