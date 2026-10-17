import type { Appointment } from "@/features/appointments/types/appointment-types";

/**
 * Tipos del registro de atención (HU-2.5).
 *
 * El psicólogo marca una cita confirmada como realizada y deja una
 * observación general, opcional. El backend hace estos dos pasos por
 * separado: primero PATCH /appointments/:id/complete y luego
 * POST /clinical-notes/register-attention, que solo acepta citas ya
 * realizadas (HU-2.5.7).
 */

/**
 * Una cita en la agenda del psicólogo, tal como la devuelve
 * GET /appointments/my-appointments. Se asume que trae los mismos campos
 * base que la lista de la asistente.
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

/** Lo que se envía a POST /clinical-notes/register-attention. */
export type RecordCarePayload = {
  appId: number;
  /** Opcional (HU-2.5.2 y HU-2.5.3): puede guardarse sin observación. */
  observation?: string;
  /** El backend rechaza el registro si no llega en true. */
  termsAccepted: true;
};