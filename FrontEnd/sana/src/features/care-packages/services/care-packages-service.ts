import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import { buildSlotDateTime, getColombiaToday } from "@/lib/date/slot-datetime";
import type { ConsultantAvailabilitySlot } from "@/features/consultation-requests/types/consultation-request-types";
import type {
  CarePackage,
  CarePackageAppointmentPayload,
  CarePackageRequest,
  CreateCarePackagePayload,
} from "../types/care-package-types";

/**
 * The backend currently exposes package creation, details, availability,
 * session booking, finalization, and cancellation. The suggestion queue,
 * rejection action, and consultant package listing routes are assumed future
 * frontend contracts.
 */

/**
 * Lists package suggestions awaiting a secretary's decision.
 * @param signal Optional request cancellation signal.
 * @returns A promise resolving to the pending package suggestions.
 */
export async function listCarePackageRequests(
  signal?: AbortSignal,
): Promise<CarePackageRequest[]> {
  return httpClient.get<CarePackageRequest[]>(
    ENDPOINTS.carePackageRequests,
    signal,
  );
}

/**
 * Creates the active package approved by the secretary.
 * @param payload Package details selected by the secretary.
 * @returns A promise resolving when the package is created.
 */
export async function createCarePackage(
  payload: CreateCarePackagePayload,
): Promise<void> {
  await httpClient.post<unknown>(ENDPOINTS.carePackages, payload);
}

/**
 * Rejects a package suggestion associated with an assessment.
 * @param assessmentAppointmentId Identifier of the assessment appointment.
 * @returns A promise resolving when the suggestion is rejected.
 */
export async function rejectCarePackageRequest(
  assessmentAppointmentId: number,
): Promise<void> {
  await httpClient.post<unknown>(
    ENDPOINTS.carePackageRequestReject(assessmentAppointmentId),
    {},
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
