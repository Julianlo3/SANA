/**
 * Appointment lifecycle states returned by the API.
 */
export type AppointmentState =
  | "pendiente"
  | "asignada"
  | "confirmada"
  | "descartada"
  | "cancelada"
  | "realizada";

/**
 * Appointment delivery modes supported by the API.
 */
export type AppointmentMode = "presencial" | "virtual";
/**
 * Identifies whether an appointment is an initial assessment or a package session.
 */
export type AppointmentKind = "valoracion" | "paquete";

/**
 * Indicates whether the appointment is for the requester or a dependent.
 */
export type PatientType = "self" | "dependent";

/**
 * Appointment request data returned by the appointments API.
 */
export type Appointment = {
  appId: number;
  appState: AppointmentState;
  /** Distinguishes initial assessments from package sessions. */
  appKind: AppointmentKind;
  /** Linked package identifier, or null for an assessment. */
  carePackageId: number | null;
  appType: AppointmentMode;
  /** Assigned or confirmed datetime; null while pending. */
  appDate: string | null;
  /** Preferred appointment date supplied with the original request. */
  appDateIdeal: string | null;
  /** Appointment duration in minutes. */
  appDuration: number | null;
  appDiscardReason: string | null;
  appCreatedAt: string;
  requesterId: number;
  requesterName: string;
  requesterCardType: string | null;
  requesterIdentityDocument: number | null;
  requesterContactNumber: string | null;
  requesterEmail: string | null;
  patientType: PatientType;
  patientName: string;
  patientIdentityDocument: string | null;
  patientBirthdate: string | null;
  patientGender: string | null;
  psychologistId: number | null;
  psychologistName: string | null;
  secretaryName: string | null;
  /** Guardian relationship to the dependent, when applicable. */
  relationshipDescription: string | null;
};

/**
 * Active psychologist option available for appointment assignment.
 */
export type PsychologistOption = {
  psyId: number;
  name: string;
  speciality: string;
  licenseNumber: number;
};

/**
 * Available time slot grouped with all psychologists who can take it.
 */
export type AvailabilitySlot = {
  date: string;
  startTime: string;
  endTime: string;
  psychologists: { id: number; name: string; speciality: string }[];
};

/**
 * Anonymized available time slot returned by the public availability API.
 */
export type PublicAvailabilitySlot = {
  date: string;
  startTime: string;
  endTime: string;
};

/**
 * Query parameters for the psychologist availability endpoint.
 */
export type AvailabilityQuery = {
  /** ISO datetime from which the search starts. */
  appointmentStart: string;
  /** Appointment duration in minutes, from 1 to 480. */
  duration: number;
  /** Forward search window in hours, from 1 to 24. */
  delayHours: number;
  /** Optional psychologist identifiers to include. */
  psychologistIds?: number[];
};

/**
 * Shared payload for provisional assignment and appointment confirmation.
 */
export type AppointmentSlotPayload = {
  psyId: number;
  /** Slot ISO datetime; must match for assignment and confirmation. */
  appDate: string;
  appDuration: number;
};

/**
 * Payload used to discard an appointment request.
 */
export type DiscardAppointmentPayload = {
  /** Discard reason, between 1 and 500 characters. */
  reason: string;
};