import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  Appointment,
  AppointmentSlotPayload,
  AppointmentState,
  AssignAppointmentPayload,
  AvailabilityQuery,
  AvailabilitySlot,
  DiscardAppointmentPayload,
  PatientPsychologistHistory,
  PublicAvailabilitySlot,
  PsychologistOption,
  ReferAppointmentPayload,
  ReferAppointmentResult,
  ReferralPsychologistOption,
  ReferralState,
} from "../types/appointment-types";

/**
 * Fixed UTC offset used to serialize Colombia appointment times.
 */
const COLOMBIA_UTC_OFFSET = "-05:00";

/**
 * Builds an ISO datetime for an availability slot in Colombia time.
 * @param date Slot date in YYYY-MM-DD format.
 * @param time Slot start time in HH:mm or HH:mm:ss format.
 * @returns The ISO datetime string with the Colombia UTC offset.
 */
export function buildSlotDateTime(date: string, time: string): string {
  const day = date.slice(0, 10);
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return `${day}T${normalizedTime}${COLOMBIA_UTC_OFFSET}`;
}

/**
 * Lists appointments.
 * @param state Optional. Current status value.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */
export async function listAppointments(
  state?: AppointmentState,
  signal?: AbortSignal,
): Promise<Appointment[]> {
  const url = state
    ? `${ENDPOINTS.appointments}?${new URLSearchParams({ state }).toString()}`
    : ENDPOINTS.appointments;

  return httpClient.get<Appointment[]>(url, signal);
}

/**
 * Retrieves appointment.
 * @param id Resource identifier.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */
export async function getAppointment(
  id: number,
  signal?: AbortSignal,
): Promise<Appointment> {
  return httpClient.get<Appointment>(ENDPOINTS.appointment(id), signal);
}

/**
 * Retrieves completed appointment history for the patient in an appointment.
 * @param id Appointment identifier used by the backend to identify the patient.
 * @param signal Optional request cancellation signal.
 * @returns Psychologist history and current streaks for that patient.
 */
export async function getPatientPsychologistHistory(
  id: number,
  signal?: AbortSignal,
): Promise<PatientPsychologistHistory[]> {
  return httpClient.get<PatientPsychologistHistory[]>(
    ENDPOINTS.appointmentPsychologistHistory(id),
    signal,
  );
}

/**
 * Lists psychologist options.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */
export async function listPsychologistOptions(
  signal?: AbortSignal,
): Promise<PsychologistOption[]> {
  return httpClient.get<PsychologistOption[]>(
    ENDPOINTS.appointmentPsychologists,
    signal,
  );
}

/**
 * Finds availability.
 * @param query Operation parameters.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */
export async function findAvailability(
  query: AvailabilityQuery,
  signal?: AbortSignal,
): Promise<AvailabilitySlot[]> {
  const params = new URLSearchParams({
    appointmentStart: query.appointmentStart,
    duration: String(query.duration),
    delayHours: String(query.delayHours),
  });

  if (query.psychologistIds && query.psychologistIds.length > 0) {
    params.set("psychologistIds", query.psychologistIds.join(","));
  }

  return httpClient.get<AvailabilitySlot[]>(
    `${ENDPOINTS.scheduleAvailability}?${params.toString()}`,
    signal,
  );
}

/**
 * Finds public availability.
 * @param query Operation parameters.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */
export async function findPublicAvailability(
  query: Pick<AvailabilityQuery, "appointmentStart" | "duration" | "delayHours">,
  signal?: AbortSignal,
): Promise<PublicAvailabilitySlot[]> {
  const params = new URLSearchParams({
    appointmentStart: query.appointmentStart,
    duration: String(query.duration),
    delayHours: String(query.delayHours),
  });

  return httpClient.get<PublicAvailabilitySlot[]>(
    `${ENDPOINTS.consultantAvailability}?${params.toString()}`,
    signal,
  );
}

/**
 * Assigns or reassigns an appointment to a psychologist and slot.
 * Supports referred appointments and an optional modality override (appType).
 * @param id Appointment identifier.
 * @param payload Assignment details, with optional appType override.
 * @returns The updated appointment.
 */
export async function assignAppointment(
  id: number,
  payload: AssignAppointmentPayload,
): Promise<Appointment> {
  return httpClient.patch<Appointment>(ENDPOINTS.appointmentAssign(id), payload);
}

/**
 * Confirms an assigned appointment using its original assignment details.
 * @param id Appointment identifier.
 * @param payload Confirmation details matching the assignment.
 * @returns The confirmed appointment.
 */
export async function confirmAppointment(
  id: number,
  payload: AppointmentSlotPayload,
): Promise<Appointment> {
  return httpClient.patch<Appointment>(
    ENDPOINTS.appointmentConfirm(id),
    payload,
  );
}

/**
 * Discards a pending or assigned appointment with a reason.
 * @param id Appointment identifier.
 * @param payload Discard reason.
 * @returns The discarded appointment.
 */
export async function discardAppointment(
  id: number,
  payload: DiscardAppointmentPayload,
): Promise<Appointment> {
  return httpClient.patch<Appointment>(
    ENDPOINTS.appointmentDiscard(id),
    payload,
  );
}

/**
 * Updates an appointment to a terminal status.
 * @param id Appointment identifier.
 * @param state New appointment status.
 * @returns The updated appointment.
 */
export async function updateAppointmentStatus(
  id: number,
  state: "cancelada" | "realizada",
): Promise<Appointment> {
  return httpClient.patch<Appointment>(ENDPOINTS.appointmentStatus(id), {
    state,
  });
}

/**
 * Lists psychologists eligible to receive a referral for the given valuation appointment.
 * Excludes the current psychologist, referral-chain members, and the patient.
 * @param appointmentId Valuation appointment identifier.
 * @param signal Optional request cancellation signal.
 * @returns A promise resolving to the list of eligible psychologists.
 */
export async function listReferralPsychologists(
  appointmentId: number,
  signal?: AbortSignal,
): Promise<ReferralPsychologistOption[]> {
  return httpClient.get<ReferralPsychologistOption[]>(
    ENDPOINTS.appointmentReferralPsychologists(appointmentId),
    signal,
  );
}

/**
 * Refers a confirmed valuation appointment to another psychologist.
 * Marks the current appointment as 'realizada' and creates a new 'remitida' valuation.
 * @param appointmentId Valuation appointment identifier to refer.
 * @param payload Target psychologist and optional referral reason (max 1000 chars).
 * @returns Source and newly created referred appointments.
 */
export async function referAppointment(
  appointmentId: number,
  payload: ReferAppointmentPayload,
): Promise<ReferAppointmentResult> {
  return httpClient.post<ReferAppointmentResult>(
    ENDPOINTS.appointmentRefer(appointmentId),
    payload,
  );
}

/**
 * Lists referred valuation appointments pending schedule assignment by the secretary.
 * @param state Filter: 'remitida' (default) or 'asignada'.
 * @param signal Optional request cancellation signal.
 * @returns A promise resolving to the list of referred appointments.
 */
export async function listPendingReferrals(
  state: ReferralState = "remitida",
  signal?: AbortSignal,
): Promise<Appointment[]> {
  const url = `${ENDPOINTS.appointmentReferrals}?${new URLSearchParams({ state }).toString()}`;
  return httpClient.get<Appointment[]>(url, signal);
}
