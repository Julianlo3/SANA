import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  ReportQuery,
  ReportResponse,
} from "../types/report-types";

type ReportKind = ReportResponse["kind"];

/**
 * Adds a query parameter when its value is defined and non-empty.
 * @param params URL query parameters to update.
 * @param key Query parameter name.
 * @param value Optional parameter value.
 * @returns Nothing.
 */
function setQueryParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value === undefined || value === "" || value === 0) return;
  params.set(key, String(value));
}

/**
 * Adds appointment-specific filters to the query.
 * @param params URL query parameters to update.
 * @param query Shared report query.
 * @returns Nothing.
 */
function addAppointmentFilters(
  params: URLSearchParams,
  query: ReportQuery,
): void {
  params.set("dateBasis", query.dateBasis ?? "scheduled");
  setQueryParam(params, "state", query.state);
  setQueryParam(params, "modality", query.modality);
  setQueryParam(params, "kind", query.kind);
  setQueryParam(params, "psyId", query.psyId);
}

/**
 * Adds attendance-specific filters to the query.
 * @param params URL query parameters to update.
 * @param query Shared report query.
 * @returns Nothing.
 */
function addAttendanceFilters(
  params: URLSearchParams,
  query: ReportQuery,
): void {
  setQueryParam(params, "modality", query.modality);
  setQueryParam(params, "kind", query.kind);
  setQueryParam(params, "psyId", query.psyId);
}

/**
 * Adds donation-history filters to the query.
 * @param params URL query parameters to update.
 * @param query Shared report query.
 * @returns Nothing.
 */
function addDonationHistoryFilters(
  params: URLSearchParams,
  query: ReportQuery,
): void {
  setQueryParam(params, "status", query.status);
  setQueryParam(params, "paymentMethod", query.paymentMethod);
}

/**
 * Adds donation-evolution filters to the query.
 * @param params URL query parameters to update.
 * @param query Shared report query.
 * @returns Nothing.
 */
function addDonationEvolutionFilters(
  params: URLSearchParams,
  query: ReportQuery,
): void {
  setQueryParam(params, "paymentMethod", query.paymentMethod);
}

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

  setQueryParam(params, "startDate", query.startDate);
  setQueryParam(params, "endDate", query.endDate);

  const appendFilters: Record<ReportKind, () => void> = {
    general: () => undefined,
    appointments: () => addAppointmentFilters(params, query),
    attendance: () => addAttendanceFilters(params, query),
    "donations-history": () => addDonationHistoryFilters(params, query),
    "donations-evolution": () => addDonationEvolutionFilters(params, query),
  };
  appendFilters[kind]();

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
