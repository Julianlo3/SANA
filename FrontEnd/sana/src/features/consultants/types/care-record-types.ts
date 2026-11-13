import type { Appointment } from "@/features/appointments/types/appointment-types";

/**
 * Data contracts for appointment completion and care records.
 *
 * Psychologists complete confirmed appointments and may add an optional
 * observation. The backend handles completion and note registration as
 * separate operations; notes are accepted only for completed appointments.
 */

/**
 * Appointment shape returned by the psychologist's appointment endpoint.
 */
export type PsychologistAppointment = Pick<
  Appointment,
  | "appId"
  | "appState"
  | "appType"
  | "appDate"
  | "appDuration"
  | "patientType"
  | "patientName"
>;

/** Payload for registering a clinical care note. */
export type RecordCarePayload = {
  appId: number;
  /** Optional observation; the care record may be saved without it. */
  observation?: string;
  /** Must be true or the backend rejects the registration. */
  termsAccepted: true;
};