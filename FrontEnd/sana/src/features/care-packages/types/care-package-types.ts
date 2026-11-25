import type {
  AppointmentMode,
  PatientType,
} from "@/features/appointments/types/appointment-types";
import type { ConsultantAvailabilitySlot } from "@/features/consultation-requests/types/consultation-request-types";

/** Priorities used to determine the consultant's care package. */
export type PackagePriority = "alta" | "media" | "baja";

/** Lifecycle states returned by the care package API. */
export type CarePackageState =
  | "sugerido"
  | "activo"
  | "rechazado"
  | "finalizado"
  | "cancelado";

/** Minimum sessions allowed in a care package (backend enforced). */
export const MIN_CARE_PACKAGE_SESSIONS = 3;
/** Maximum sessions allowed in a care package (backend enforced). */
export const MAX_CARE_PACKAGE_SESSIONS = 12;

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
  /**
   * Number of sessions recommended by the psychologist.
   * Must be between MIN_CARE_PACKAGE_SESSIONS and MAX_CARE_PACKAGE_SESSIONS (3–12).
   */
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
  /**
   * Number of sessions included in the package.
   * Must be between MIN_CARE_PACKAGE_SESSIONS and MAX_CARE_PACKAGE_SESSIONS (3–12).
   */
  sessionLimit: number;
  /** Priority assigned to the package. */
  priority: PackagePriority;
  /** Optional context for the package. */
  comment?: string;
};

/** Optional changes entered by the secretary when approving a suggestion. */
export type ApproveCarePackagePayload = {
  /**
   * Revised session count, if changed.
   * When provided, must be between MIN_CARE_PACKAGE_SESSIONS and MAX_CARE_PACKAGE_SESSIONS (3–12).
   */
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

/** Availability slot offered by the treating psychologist for follow-up valuation. */
export type FollowUpValuationAvailabilitySlot =
  ConsultantAvailabilitySlot & {
    /** Treating psychologist who owns this available slot. */
    psychologists: { id: number; name: string; speciality: string }[];
  };

/** Payload for booking a post-package follow-up valuation. */
export type ScheduleFollowUpValuationPayload = {
  /** Selected slot start as an ISO datetime. */
  appDate: string;
  /** Optional appointment mode; omitted to inherit the previous valuation mode. */
  appType?: AppointmentMode;
  /** Optional note for the treating psychologist. */
  appReason?: string;
};

/** Result returned after booking a post-package follow-up valuation. */
export type ScheduleFollowUpValuationResult = {
  /** Newly created appointment identifier. */
  appId: number;
  /** Confirmed appointment date and time. */
  appDate: string;
  /** Appointment state returned by the backend. */
  appState: "confirmada";
  /** Follow-up assessments are not linked to a package. */
  appKind: "valoracion";
  /** Appointment mode, inherited or selected. */
  appType: AppointmentMode;
  /** Treating psychologist assigned to the appointment. */
  psychologistId: number;
  /** Follow-up valuations are not linked to a care package. */
  carePackageId: null;
};
