/**
 * Appointment lifecycle states returned by the API.
 */
export type AppointmentState =
  | "pendiente"
  | "asignada"
  | "confirmada"
  | "descartada"
  | "cancelada"
  | "realizada"
  | "remitida";

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
  /** ID of the source valuation appointment if this appointment originated from a referral. */
  referredFromAppId?: number | null;
  /** Psychologist ID receiving the referral if this appointment was referred out. */
  referredToPsychologistId?: number | null;
  /** Name of the referred psychologist receiving the referral. */
  referredToPsychologistName?: string | null;
  /** Clinical or administrative observation explaining the referral. */
  referralReason?: string | null;
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
 * Completed appointment history and current streak for a psychologist with
 * the patient identified by a secretary-managed appointment.
 */
export type PatientPsychologistHistory = {
  psyId: number;
  psychologistName: string;
  totalAppointments: number;
  currentStreak: number;
  lastAppointmentDate: string;
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

/**
 * Psychologist eligible to receive a referral for a specific valuation appointment.
 * Excludes the current psychologist, prior chain members, and the patient themselves.
 */
export type ReferralPsychologistOption = {
  psyId: number;
  name: string;
  speciality: string;
  licenseNumber: number;
};

/**
 * Payload sent by a psychologist to refer a valuation appointment.
 */
export type ReferAppointmentPayload = {
  /** Target psychologist who will receive the new referred valuation. */
  targetPsychologistId: number;
  /** Optional clinical or administrative reason (max 1000 chars). */
  reason?: string;
};

/**
 * Result returned after a successful referral: source and new referred appointments.
 */
export type ReferAppointmentResult = {
  /** Original valuation updated to 'realizada' with referral metadata. */
  sourceAppointment: Appointment;
  /** New valuation in 'remitida' state pre-assigned to the target psychologist. */
  referredAppointment: Appointment;
};

/**
 * Query state filter accepted by GET /appointments/referrals.
 */
export type ReferralState = "remitida" | "asignada";

/**
 * Optional modality override allowed when assigning a referred appointment.
 */
export type AssignAppointmentPayload = AppointmentSlotPayload & {
  /** Modality override; when omitted the referred appointment's modality is preserved. */
  appType?: AppointmentMode;
};