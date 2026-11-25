import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import {
  buildSlotDateTime,
  COLOMBIA_UTC_OFFSET,
} from "@/lib/date/slot-datetime";
import type { ConsultantAvailabilitySlot } from "@/features/consultation-requests/types/consultation-request-types";
import type {
  ApproveCarePackagePayload,
  CarePackage,
  CarePackageAppointmentPayload,
  CarePackageSuggestion,
  CreateCarePackagePayload,
  RejectCarePackagePayload,
  FollowUpValuationAvailabilitySlot,
  ScheduleFollowUpValuationPayload,
  ScheduleFollowUpValuationResult,
  SuggestCarePackagePayload,
  SuggestCarePackageResult,
} from "../types/care-package-types";

/** Availability range shown by the package calendar, in hours. */
const PACKAGE_AVAILABILITY_HOURS = 720;
/** Duration of one care package session in minutes. */
const PACKAGE_SESSION_DURATION_MINUTES = 60;

/**
 * Builds the shared 30-day availability query starting at the next Colombia hour.
 * @returns Availability query parameters for the package calendars.
 */
function buildPackageAvailabilityQuery(): URLSearchParams {
  const offsetHours = Number(COLOMBIA_UTC_OFFSET.slice(0, 3));
  const nextColombiaHour = new Date(
    Date.now() + offsetHours * 60 * 60 * 1000,
  );
  nextColombiaHour.setUTCHours(nextColombiaHour.getUTCHours() + 1, 0, 0, 0);

  const firstSlotStart = buildSlotDateTime(
    nextColombiaHour.toISOString().slice(0, 10),
    nextColombiaHour.toISOString().slice(11, 19),
  );
  return new URLSearchParams({
    appointmentStart: firstSlotStart,
    delayHours: String(PACKAGE_AVAILABILITY_HOURS),
    duration: String(PACKAGE_SESSION_DURATION_MINUTES),
  });
}

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
  const params = buildPackageAvailabilityQuery();
  const slots = await httpClient.get<ConsultantAvailabilitySlot[]>(
    `${ENDPOINTS.carePackageAvailability(carePackageId)}?${params.toString()}`,
    signal,
  );
  return slots.map((slot) => ({ ...slot, date: slot.date.slice(0, 10) }));
}

/**
 * Retrieves availability from the treating psychologist for a finalized package.
 * @param carePackageId Identifier of the finalized care package.
 * @param signal Optional request cancellation signal.
 * @returns A promise resolving to the treating psychologist's available slots.
 */
export async function getFollowUpValuationAvailability(
  carePackageId: number,
  signal?: AbortSignal,
): Promise<FollowUpValuationAvailabilitySlot[]> {
  const params = buildPackageAvailabilityQuery();
  const slots = await httpClient.get<FollowUpValuationAvailabilitySlot[]>(
    `${ENDPOINTS.carePackageFollowUpValuationAvailability(carePackageId)}?${params.toString()}`,
    signal,
  );
  return slots.map((slot) => ({ ...slot, date: slot.date.slice(0, 10) }));
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

/**
 * Books a follow-up valuation with the psychologist from a finalized package.
 * @param carePackageId Identifier of the finalized care package.
 * @param payload Selected appointment date and optional valuation details.
 * @returns A promise resolving to the confirmed follow-up valuation.
 */
export async function bookFollowUpValuation(
  carePackageId: number,
  payload: ScheduleFollowUpValuationPayload,
): Promise<ScheduleFollowUpValuationResult> {
  return httpClient.post<ScheduleFollowUpValuationResult>(
    ENDPOINTS.carePackageFollowUpValuation(carePackageId),
    payload,
  );
}
