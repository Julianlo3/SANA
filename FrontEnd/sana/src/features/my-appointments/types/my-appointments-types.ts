import type {
  AppointmentMode,
  PatientType,
} from "@/features/appointments/types/appointment-types";

/** Appointment states accepted by the psychologist appointment endpoint. */
export type MyAppointmentState = "confirmada" | "realizada" | "cancelada";

/**
 * Appointment data returned to the treating psychologist.
 * Only the treating psychologist receives the consultation reason.
 */
export type MyAppointment = {
  appId: number;
  appState: MyAppointmentState;
  appType: AppointmentMode;
  appDate: string | null;
  appDuration: number | null;
  patientType: PatientType;
  patientName: string;
  appReason?: string | null;
};

/**
 * Defines the appointment clinical note type.
 */

export type AppointmentClinicalNote = {
  cnId: number;
  appId: number;
  psyId: number;
  cnObservation: string;
  cnTermsAccepted: boolean;
  cnCreatedAt: string;
};