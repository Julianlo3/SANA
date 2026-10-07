import type { ScheduleBlock } from "./schedule-types";

/**
 * Respuesta de GET /schedule/psychologists/:psychologistId/calendar.
 * Solo la asistente (rol secretario) puede consultarla.
 */

/** Un intervalo ya ocupado: una cita asignada o una ocupación manual. */
export type ScheduleOccupancy = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  sourceType: "appointment" | "manual";
  appointmentId: number | null;
};

export type PsychologistCalendar = {
  /** Bloques de disponibilidad puntuales del psicólogo. */
  availability: ScheduleBlock[];
  /** Citas y ocupaciones que ya consumen esos bloques. */
  occupancy: ScheduleOccupancy[];
};