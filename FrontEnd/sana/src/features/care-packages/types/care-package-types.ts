import type { PatientType } from "@/features/appointments/types/appointment-types";

/** Priorities used to determine the consultant's care package. */
export type PackagePriority = "alta" | "media" | "baja";

/** A completed assessment waiting for the secretary's package decision. */
export type CarePackageRequest = {
  /** Assessment awaiting a package decision. */
  assessmentAppointmentId: number;
  /** Name of the person receiving care. */
  patientName: string;
  /** Indicates whether care is for the requester or a dependent. */
  patientType: PatientType;
  /** Name of the account that submitted the appointment request. */
  requesterName: string;
  /** Requester's contact number, when available. */
  requesterContactNumber: string | null;
  /** Requester's email address, when available. */
  requesterEmail: string | null;
  /** Priority selected by the psychologist. */
  priority: PackagePriority;
  /** Suggested number of sessions, or null when not specified. */
  suggestedSessionLimit: number | null;
};

/** Active package summary returned for the signed-in consultant. */
export type CarePackage = {
  /** Package identifier. */
  id: number;
  /** Current package lifecycle state. */
  state: "activo" | "finalizado" | "cancelado";
  /** Priority selected during the assessment. */
  priority: PackagePriority;
  /** Number of sessions included in the package. */
  sessionLimit: number;
  /** Assigned psychologist's name, when supplied by the API. */
  psychologistName: string | null;
};

/**
 * Payload used to create an active package after secretary approval.
 * The existing POST /care-packages endpoint accepts these fields.
 */
export type CreateCarePackagePayload = {
  /** Assessment that originated the package suggestion. */
  assessmentAppointmentId: number;
  /** Final number of sessions approved by the secretary. */
  sessionLimit: number;
  /** Priority selected during the assessment. */
  priority: PackagePriority;
};

/**
 * Payload for booking a package session; the route binds the package ID and
 * the backend inherits the assessment's appointment mode.
 */
export type CarePackageAppointmentPayload = {
  /** Selected slot start as an ISO datetime. */
  appDate: string;
};
