import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import { buildSlotDateTime, getColombiaToday } from "@/lib/date/slot-datetime";
import type { ConsultantAvailabilitySlot } from "@/features/consultation-requests/types/consultation-request-types";
import type {
  ApproveCarePackagePayload,
  CarePackage,
  CarePackageAppointmentPayload,
  CarePackageSuggestion,
  CreateCarePackagePayload,
  RejectCarePackagePayload,
  SuggestCarePackagePayload,
  SuggestCarePackageResult,
} from "../types/care-package-types";

/**
 * Lists persisted care packages for secretary management.
 * @param signal Optional request cancellation signal.
 * @returns A promise resolving to the care package list.
 */
export async function listCarePackages(
  signal?: AbortSignal,
): Promise<CarePackage[]> {
  return httpClient.get<CarePackage[]>(ENDPOINTS.carePackages, signal);
}

/**
 * Submits a psychologist's package suggestion for secretary review.
 * @param payload Assessment, suggested session count, priority, and optional note.
 * @returns A promise resolving to the created suggested package.
 */
export async function suggestCarePackage(
  payload: SuggestCarePackagePayload,
): Promise<SuggestCarePackageResult> {
  return httpClient.post<SuggestCarePackageResult>(
    ENDPOINTS.carePackageSuggest,
    payload,
  );
}

/**
 * Lists suggested packages awaiting secretary review.
 * @param signal Optional request cancellation signal.
 * @returns A promise resolving to the suggestions in priority order.
 */
export async function listCarePackageSuggestions(
  signal?: AbortSignal,
): Promise<CarePackageSuggestion[]> {
  return httpClient.get<CarePackageSuggestion[]>(
    ENDPOINTS.carePackageSuggestions,
    signal,
  );
}

/**
 * Creates a package directly as secretary.
 * @param payload Package details selected by the secretary.
 * @returns A promise resolving to the created package.
 */
export async function createCarePackage(
  payload: CreateCarePackagePayload,
): Promise<CarePackage> {
  return httpClient.post<CarePackage>(ENDPOINTS.carePackages, payload);
}

/**
 * Approves a suggested package, optionally applying secretary edits.
 * @param carePackageId Identifier of the suggested package.
 * @param payload Optional revised priority and session count.
 * @returns A promise resolving to the activated package.
 */
export async function approveCarePackage(
  carePackageId: number,
  payload: ApproveCarePackagePayload,
): Promise<CarePackage> {
  return httpClient.patch<CarePackage>(
    ENDPOINTS.carePackageApprove(carePackageId),
    payload,
  );
}

/**
 * Rejects a suggested package with a required reason.
 * @param carePackageId Identifier of the suggested package.
 * @param payload Rejection reason.
 * @returns A promise resolving to the rejected package.
 */
export async function rejectCarePackage(
  carePackageId: number,
  payload: RejectCarePackagePayload,
): Promise<CarePackage> {
  return httpClient.patch<CarePackage>(
    ENDPOINTS.carePackageReject(carePackageId),
    payload,
  );
}

/**
 * Lists packages belonging to the authenticated consultant.
 * @param signal Optional request cancellation signal.
 * @returns A promise resolving to the consultant's care packages.
 */
export async function listMyCarePackages(
  signal?: AbortSignal,
): Promise<CarePackage[]> {
  return httpClient.get<CarePackage[]>(ENDPOINTS.carePackagesMine, signal);
}

/**
 * Retrieves availability scoped to one active care package.
 * @param carePackageId Identifier of the active care package.
 * @param signal Optional request cancellation signal.
 * @returns A promise resolving to the package's available appointment slots.
 */
export async function getCarePackageAvailability(
  carePackageId: number,
  signal?: AbortSignal,
): Promise<ConsultantAvailabilitySlot[]> {
  const today = getColombiaToday();
  const params = new URLSearchParams({
    appointmentStart: buildSlotDateTime(today, "00:00:00"),
    delayHours: "720",
    duration: "60",
  });
  return httpClient.get<ConsultantAvailabilitySlot[]>(
    `${ENDPOINTS.carePackageAvailability(carePackageId)}?${params.toString()}`,
    signal,
  );
}

/**
 * Books a session against an active care package.
 * @param carePackageId Identifier of the active care package.
 * @param payload Appointment date to book.
 * @returns A promise resolving when the appointment is booked.
 */
export async function bookCarePackageAppointment(
  carePackageId: number,
  payload: CarePackageAppointmentPayload,
): Promise<void> {
  await httpClient.post<unknown>(
    ENDPOINTS.carePackageAppointments(carePackageId),
    payload,
  );
}
