"use client";

import { useCallback, useEffect, useState } from "react";
import { getReport } from "../services/reports-service";
import type {
  ReportQuery,
  ReportResponse,
} from "../types/report-types";

type ReportKind = ReportResponse["kind"];

/**
 * Loads the active report and cancels stale requests when filters change.
 * @param kind Report selected in the dashboard.
 * @param query Date range and report-specific filters.
 * @param enabled Whether the query is valid and should be sent.
 * @returns Report data, loading state, error, and refresh handler.
 */
export function useReportsDashboard(
  kind: ReportKind,
  query: ReportQuery,
  enabled: boolean,
) {
  const [reloadKey, setReloadKey] = useState(0);
  const [requestState, setRequestState] = useState<{
    key: string;
    response: ReportResponse | null;
    error: string | null;
  } | null>(null);

  const queryKey = JSON.stringify(query);
  const requestKey = `${kind}:${queryKey}:${reloadKey}`;

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    getReport(kind, query, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setRequestState({ key: requestKey, response, error: null });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setRequestState({
          key: requestKey,
          response: null,
          error:
            cause instanceof Error
              ? cause.message
              : "No se pudo cargar el reporte. Intenta de nuevo.",
        });
      });

    return () => controller.abort();
  }, [enabled, kind, query, requestKey]);

  const refresh = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const matchingRequest = requestState?.key === requestKey;

  return {
    response: matchingRequest ? requestState.response : null,
    isLoading: enabled && !matchingRequest,
    error: matchingRequest ? requestState.error : null,
    refresh,
  };
}
