/**
 * Tipos del dominio de consultantes (HU-2.1, HU-2.4 y HU-2.5).
 *
 * Punto central de HU-2.4: el motivo de consulta y las observaciones de
 * atención NUNCA viajan en la misma forma que ve la asistente. El backend
 * debe devolver un objeto distinto según el rol de quien pregunta — esto
 * no se resuelve ocultando campos en el frontend, porque cualquiera con
 * las herramientas del navegador vería igual lo que el backend envíe.
 */

import type { ResidenceLocation } from "@/features/consultation-requests/types/consultation-request-types";

/** Estado de la ficha del consultante. */
export type ConsultantStatus = "active" | "inactive";

/**
 * Lo que ve la asistente administrativa (HU-2.4.1): datos de agendamiento
 * y contacto, sin motivo de consulta ni observaciones clínicas.
 */
export type ConsultantSummary = {
  id: number;
  fullName: string;
  identityDocument: string;
  email: string;
  phone: string;
  residence: ResidenceLocation | null;
  status: ConsultantStatus;
  /** Psicólogo asignado, si tiene uno. */
  assignedPsychologistId: number | null;
  assignedPsychologistName: string | null;
  /** Fecha de la última cita, si tuvo alguna. */
  lastAppointmentAt: string | null;
};

/**
 * Lo que ve el psicólogo tratante (HU-2.4.2): la ficha completa, incluido
 * el motivo de consulta y el historial de observaciones de atención.
 */
export type ConsultantFullRecord = ConsultantSummary & {
  consultationReason: string;
  careRecords: CareRecordEntry[];
};

/** Una atención registrada, dentro del historial del consultante. */
export type CareRecordEntry = {
  id: number;
  appointmentId: number;
  attendedAt: string;
  /** Opcional (HU-2.5.2 y 2.5.3). */
  observation: string | null;
  recordedByPsychologistId: number;
  recordedByPsychologistName: string;
};

/** HU-2.4.4: registro de quién consultó una ficha y cuándo. */
export type ConsultantAccessLogEntry = {
  id: number;
  consultantId: number;
  userId: number;
  userName: string;
  userRole: string;
  accessedAt: string;
};