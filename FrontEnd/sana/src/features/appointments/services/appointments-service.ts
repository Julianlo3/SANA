import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  Appointment,
  AppointmentSlotPayload,
  AppointmentState,
  AvailabilityQuery,
  AvailabilitySlot,
  DiscardAppointmentPayload,
  PublicAvailabilitySlot,
  PsychologistOption,
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
 * @param id Appointment identifier.
 * @param payload Assignment details.
 * @returns The updated appointment.
 */
export async function assignAppointment(
  id: number,
  payload: AppointmentSlotPayload,
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