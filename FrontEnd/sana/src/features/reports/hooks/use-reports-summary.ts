"use client";

import { useEffect, useState } from "react";
import { getReportsSummary } from "../services/reports-service";
import type { ReportsSummary } from "../types/report-types";

/**
 * Loads the aggregate report summary and supports manual refresh.
 * @returns Summary data, loading state, error, and refresh handler.
 */
export function useReportsSummary() {
  const [requestState, setRequestState] = useState<{
    completedKey: number | null;
    summary: ReportsSummary | null;
    error: string | null;
  }>({ completedKey: null, summary: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getReportsSummary(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setRequestState({
          completedKey: reloadKey,
          summary: result,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setRequestState((current) => ({
          completedKey: reloadKey,
          summary: current.summary,
          error:
            cause instanceof Error
              ? cause.message
              : "No se pudieron cargar los reportes. Intenta de nuevo.",
        }));
      });

    return () => controller.abort();
  }, [reloadKey]);

  return {
    summary: requestState.summary,
    isLoading: requestState.completedKey !== reloadKey,
    error:
      requestState.completedKey === reloadKey ? requestState.error : null,
    refresh: () => setReloadKey((current) => current + 1),
  };
}
