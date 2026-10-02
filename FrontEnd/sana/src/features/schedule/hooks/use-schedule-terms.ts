"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptScheduleTerms,
  getScheduleTermsStatus,
} from "../services/schedule-service";
import { getPolicyDocument } from "@/features/consultation-requests/services/policy-service";

/**
 * El psicólogo debe aceptar los términos de agenda (schedule_terms) antes
 * de poder usar su calendario. Trae el estado y el texto, y expone cómo
 * aceptarlos.
 */
export function useScheduleTerms() {
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null);
  const [policyContent, setPolicyContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getScheduleTermsStatus(), getPolicyDocument("schedule_terms")])
      .then(([status, policy]) => {
        if (!isMounted) return;
        setHasAccepted(status.hasAccepted);
        setPolicyContent(policy.pdContent);
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
  }, []);

  const accept = useCallback(async () => {
    setIsAccepting(true);
    try {
      await acceptScheduleTerms();
      setHasAccepted(true);
    } finally {
      setIsAccepting(false);
    }
  }, []);

  return { hasAccepted, policyContent, isLoading, loadError, isAccepting, accept };
}