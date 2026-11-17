import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  ReportQuery,
  ReportResponse,
} from "../types/report-types";

type ReportKind = ReportResponse["kind"];

/**
 * Builds an endpoint URL with shared and report-specific filters.
 * @param kind Report endpoint to query.
 * @param query Date range and report filters.
 * @returns Request URL with encoded query parameters.
 */
function buildReportUrl(kind: ReportKind, query: ReportQuery): string {
  const endpointByKind: Record<ReportKind, string> = {
    general: ENDPOINTS.reportsGeneral,
    appointments: ENDPOINTS.reportsAppointmentsEvolution,
    attendance: ENDPOINTS.reportsAttendance,
    "donations-history": ENDPOINTS.reportsDonationsHistory,
    "donations-evolution": ENDPOINTS.reportsDonationsEvolution,
  };
  const params = new URLSearchParams({ preset: query.preset });

  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);

  if (kind === "appointments") {
    params.set("dateBasis", query.dateBasis ?? "scheduled");
    if (query.state) params.set("state", query.state);
    if (query.modality) params.set("modality", query.modality);
    if (query.kind) params.set("kind", query.kind);
    if (query.psyId) params.set("psyId", String(query.psyId));
  }

  if (kind === "attendance") {
    if (query.modality) params.set("modality", query.modality);
    if (query.kind) params.set("kind", query.kind);
    if (query.psyId) params.set("psyId", String(query.psyId));
  }

  if (kind === "donations-history" || kind === "donations-evolution") {
    if (query.status && kind === "donations-history") {
      params.set("status", query.status);
    }
    if (query.paymentMethod) params.set("paymentMethod", query.paymentMethod);
  }

  return `${endpointByKind[kind]}?${params.toString()}`;
}

/**
 * Loads one administrator report with the shared date range and its filters.
 * @param kind Report selected in the dashboard.
 * @param query Date range and report-specific filters.
 * @param signal Optional request cancellation signal.
 * @returns A discriminated report response.
 */
export async function getReport(
  kind: ReportKind,
  query: ReportQuery,
  signal?: AbortSignal,
): Promise<ReportResponse> {
  const url = buildReportUrl(kind, query);

  switch (kind) {
    case "general":
      return {
        kind,
        data: await httpClient.get<Extract<ReportResponse, { kind: "general" }>["data"]>(
          url,
          signal,
        ),
      };
    case "appointments":
      return {
        kind,
        data: await httpClient.get<Extract<ReportResponse, { kind: "appointments" }>["data"]>(
          url,
          signal,
        ),
      };
    case "attendance":
      return {
        kind,
        data: await httpClient.get<Extract<ReportResponse, { kind: "attendance" }>["data"]>(
          url,
          signal,
        ),
      };
    case "donations-history":
      return {
        kind,
        data: await httpClient.get<Extract<ReportResponse, { kind: "donations-history" }>["data"]>(
          url,
          signal,
        ),
      };
    case "donations-evolution":
      return {
        kind,
        data: await httpClient.get<Extract<ReportResponse, { kind: "donations-evolution" }>["data"]>(
          url,
          signal,
        ),
      };
  }
}
