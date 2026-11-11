/**
 * Data contracts for consultant profiles and care records.
 *
 * Consultation reasons and clinical notes must not be included in the
 * assistant-facing response. The backend returns role-specific data objects;
 * hiding fields in the frontend would not protect them from browser access.
 */

import type { ResidenceLocation } from "@/config/residence-zones";

/** Consultant profile lifecycle state. */
export type ConsultantStatus = "active" | "inactive";

/**
 * Assistant-facing scheduling and contact data, excluding consultation
 * reasons and clinical notes.
 */
export type ConsultantSummary = {
  id: number;
  fullName: string;
  identityDocument: string;
  email: string;
  phone: string;
  residence: ResidenceLocation | null;
  status: ConsultantStatus;
  /** Assigned psychologist, if any. */
  assignedPsychologistId: number | null;
  assignedPsychologistName: string | null;
  /** Date of the most recent appointment, if any. */
  lastAppointmentAt: string | null;
  appointmentCount: number;
  completedAppointmentCount?: number;
  waitingAppointmentCount?: number;
};

/**
 * Defines the consultant full record type.
 */

export type ConsultantFullRecord = ConsultantSummary & {
  careRecords: CareRecordEntry[];
  appointments: ConsultantAppointment[];
};

/**
 * Defines the consultant appointment type.
 */

export type ConsultantAppointment = {
  id: number;
  state: "asignada" | "confirmada" | "realizada";
  appDate: string | null;
  duration: number | null;
  reason: string | null;
  patientType: "self" | "dependent";
  patientName: string;
  patientDependentId: number | null;
  clinicalNotes: {
    id: number;
    observation: string;
    createdAt: string;
  }[];
};

/** A recorded care entry in the consultant's history. */
export type CareRecordEntry = {
  id: number;
  appointmentId: number;
  attendedAt: string | null;
  /** Opcional (HU-2.5.2 y 2.5.3). */
  observation: string | null;
  patientType: "self" | "dependent";
  patientName: string;
  patientDependentId: number | null;
  recordedByPsychologistId: number;
  recordedByPsychologistName: string;
};

/** Audit entry describing who accessed a consultant record and when. */
export type ConsultantAccessLogEntry = {
  id: number;
  consultantId: number;
  userId: number;
  userName: string;
  userRole: string;
  accessedAt: string;
};
/** Channel used by the assistant to obtain verbal consent. */
export type AssistedConsentChannel = "telefono" | "whatsapp" | "presencial";

/** Payload for an assistant-created consultant profile. */
export type CreateConsultantPayload = {
  fullName: string;
  cardType: "CC" | "TI" | "CE";
  identityDocument: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: "F" | "M" | "O" | "P";
  termsAccepted: boolean;
  channel?: AssistedConsentChannel;
};
