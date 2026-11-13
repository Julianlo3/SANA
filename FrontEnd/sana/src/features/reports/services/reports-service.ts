import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type { ReportsSummary } from "../types/report-types";

/**
 * Retrieves the administrator's aggregate report metrics.
 * @param signal Optional request cancellation signal.
 * @returns The aggregate report summary.
 */
export function getReportsSummary(
  signal?: AbortSignal,
): Promise<ReportsSummary> {
  return httpClient.get<ReportsSummary>(ENDPOINTS.reportsSummary, signal);
}
