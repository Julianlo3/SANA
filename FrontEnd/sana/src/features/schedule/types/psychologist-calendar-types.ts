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

/** Un intervalo del día, en minutos desde la medianoche. */
export type TimeRange = {
  start: number;
  end: number;
};

export type DayAppointment = TimeRange & {
  appointmentId: number | null;
};

/** Todo lo que pasa en un día: lo que el psicólogo abrió, lo ocupado y lo que queda libre. */
export type DaySummary = {
  /** AAAA-MM-DD. */
  date: string;
  blocks: TimeRange[];
  appointments: DayAppointment[];
  free: TimeRange[];
};

export type DayStatus = "free" | "full" | "none";