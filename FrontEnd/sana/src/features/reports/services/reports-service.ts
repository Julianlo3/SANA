import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  ReportQuery,
  ReportResponse,
} from "../types/report-types";

type ReportKind = ReportResponse["kind"];
type ReportData<Kind extends ReportKind> = Extract<
  ReportResponse,
  { kind: Kind }
>["data"];
type ReportLoader = (
  url: string,
  signal?: AbortSignal,
) => Promise<ReportResponse>;

/**
 * Wraps typed report data in its discriminated response.
 * @param fetchData Typed endpoint data loader.
 * @param createResponse Builds the response for the matching report type.
 * @returns A loader that returns the matching report response.
 */
function createReportLoader<Kind extends ReportKind>(
  fetchData: (
    url: string,
    signal?: AbortSignal,
  ) => Promise<ReportData<Kind>>,
  createResponse: (
    data: ReportData<Kind>,
  ) => Extract<ReportResponse, { kind: Kind }>,
): ReportLoader {
  return async (url, signal) => createResponse(await fetchData(url, signal));
}

const reportLoaders = {
  general: createReportLoader<"general">(
    (url, signal) => httpClient.get<ReportData<"general">>(url, signal),
    (data) => ({ kind: "general", data }),
  ),
  appointments: createReportLoader<"appointments">(
    (url, signal) => httpClient.get<ReportData<"appointments">>(url, signal),
    (data) => ({ kind: "appointments", data }),
  ),
  attendance: createReportLoader<"attendance">(
    (url, signal) => httpClient.get<ReportData<"attendance">>(url, signal),
    (data) => ({ kind: "attendance", data }),
  ),
  "donations-history": createReportLoader<"donations-history">(
    (url, signal) => httpClient.get<ReportData<"donations-history">>(url, signal),
    (data) => ({ kind: "donations-history", data }),
  ),
  "donations-evolution": createReportLoader<"donations-evolution">(
    (url, signal) => httpClient.get<ReportData<"donations-evolution">>(url, signal),
    (data) => ({ kind: "donations-evolution", data }),
  ),
} satisfies Record<ReportKind, ReportLoader>;

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
  return reportLoaders[kind](url, signal);
}
