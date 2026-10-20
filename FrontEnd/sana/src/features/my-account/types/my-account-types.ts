import type {
  AppointmentMode,
  AppointmentState,
  PatientType,
} from "@/features/appointments/types/appointment-types";
import type { Gender } from "@/features/consultation-requests/types/consultation-request-types";

/**
 * Type response for GET /users/me.
 */
export type OwnProfile = {
  fullName: string;
  cardType: string | null;
  identityDocument: string | null;
  email: string;
  phone: string | null;
  birthdate: string | null;
  gender: string | null;
  residenceZone: string | null;
  vulnerabilities: string[] | null;
  canEditConsultantFields: boolean;
};

/**
 * Type for updating the current user's profile.
 * Email and document cannot be updated.
 */
export type UpdateOwnProfilePayload = {
  fullName: string;
  phone: string;
  birthdate?: string | null;
  gender?: Gender | null;
  residenceZone?: string | null;
};

/**
 * Type for GET /appointments/my-requests.
 */
export type MyRequest = {
  appId: number;
  appState: AppointmentState;
  appType: AppointmentMode;
  appDate: string | null;
  appDuration: number | null;
  appCreatedAt: string;
  patientType: PatientType;
  patientName: string;
  psychologistName: string | null;
};