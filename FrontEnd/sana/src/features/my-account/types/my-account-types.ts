import type {
  AppointmentMode,
  AppointmentState,
  PatientType,
} from "@/features/appointments/types/appointment-types";
import type { Gender } from "@/features/consultation-requests/types/consultation-request-types";

/** Respuesta de GET /users/me. */
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
};

/** Lo que se puede cambiar con PATCH /users/me. El correo y el documento no. */
export type UpdateOwnProfilePayload = {
  fullName: string;
  phone: string;
  birthdate: string | null;
  gender: Gender | null;
  residenceZone: string | null;
};

/** Una solicitud de la persona, tal como la devuelve GET /appointments/my-requests. */
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