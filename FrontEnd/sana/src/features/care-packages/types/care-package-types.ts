import type { PatientType } from "@/features/appointments/types/appointment-types";

/** Priorities used to determine the consultant's care package. */
export type PackagePriority = "alta" | "media" | "baja";

/** Lifecycle states returned by the care package API. */
export type CarePackageState =
  | "sugerido"
  | "activo"
  | "rechazado"
  | "finalizado"
  | "cancelado";

/** Package record returned by the care package API. */
export type CarePackage = {
  /** Package identifier. */
  id: number;
  /** Current package lifecycle state. */
  state: CarePackageState;
  /** Priority selected during the assessment. */
  priority: PackagePriority;
  /** Number of sessions included in the package. */
  sessionLimit: number;
  /** Original session count suggested by the psychologist. */
  suggestedSessionLimit?: number | null;
  /** Original priority suggested by the psychologist. */
  suggestedPriority?: PackagePriority | null;
  /** Note from the psychologist, when provided. */
  suggestionComment?: string | null;
  /** Reason entered by the secretary when rejecting the suggestion. */
  rejectionReason?: string | null;
  /** Creation timestamp. */
  createdAt: string;
  /** Last review timestamp. */
  reviewedAt?: string | null;
  /** Closing timestamp, or null while the package is open. */
  closedAt: string | null;
  /** Reason provided when closing the package. */
  closeReason?: string | null;
  /** Assigned psychologist identifier. */
  psychologistId: number;
  /** Assigned psychologist's name. */
  psychologistName: string | null;
  /** Indicates whether care is for the requester or a dependent. */
  patientType: PatientType;
  /** Name of the person receiving care. */
  patientName: string;
  /** Number of the patient or dependent. */
  patientId?: number;
  /** Number of completed package sessions. */
  completedSessions: number;
  /** Number of assigned or confirmed package sessions. */
  reservedSessions: number;
  /** Number of sessions still available to book. */
  availableSessions?: number;
  /** Count of patient no-shows reported by the backend. */
  noShowCount?: number;
};

/**
 * Payload used by the psychologist to create a package suggestion.
 */
export type SuggestCarePackagePayload = {
  /** Assessment that originated the package suggestion. */
  assessmentAppointmentId: number;
  /** Number of sessions recommended by the psychologist. */
  sessionLimit: number;
  /** Priority selected during the assessment. */
  priority: PackagePriority;
  /** Optional context for the secretary. */
  comment?: string;
};

/** Compact record returned immediately after creating a suggestion. */
export type SuggestCarePackageResult = Pick<
  CarePackage,
  | "id"
  | "state"
  | "sessionLimit"
  | "priority"
  | "psychologistId"
  | "suggestionComment"
  | "createdAt"
>;

/** Pending suggestion record, including the source assessment identifier. */
export type CarePackageSuggestion = Pick<
  CarePackage,
  | "id"
  | "state"
  | "sessionLimit"
  | "priority"
  | "suggestedSessionLimit"
  | "suggestedPriority"
  | "suggestionComment"
  | "createdAt"
  | "psychologistId"
  | "psychologistName"
  | "patientType"
  | "patientName"
  | "patientId"
  | "noShowCount"
> & {
  /** Assessment appointment used to load the secretary-visible contact. */
  assessmentAppointmentId: number;
};

/** Payload used by the secretary to create a package without a suggestion. */
export type CreateCarePackagePayload = {
  /** Assessment that originated the package. */
  assessmentAppointmentId: number;
  /** Number of sessions included in the package. */
  sessionLimit: number;
  /** Priority assigned to the package. */
  priority: PackagePriority;
  /** Optional context for the package. */
  comment?: string;
};

/** Optional changes entered by the secretary when approving a suggestion. */
export type ApproveCarePackagePayload = {
  /** Revised session count, if changed. */
  sessionLimit?: number;
  /** Revised priority, if changed. */
  priority?: PackagePriority;
};

/** Required reason submitted when rejecting a suggestion. */
export type RejectCarePackagePayload = {
  /** Explanation for rejecting the suggestion. */
  reason: string;
};

/**
 * Payload for booking a package session; the route binds the package ID and
 * the backend inherits the assessment's appointment mode.
 */
export type CarePackageAppointmentPayload = {
  /** Selected slot start as an ISO datetime. */
  appDate: string;
};
