import type { ScheduleBlock } from "./schedule-types";

/**
 * Respuesta de GET /schedule/psychologists/:psychologistId/calendar.
 * Only assistants with the secretary role can access this calendar.
 */

/** Time interval occupied by an assigned appointment or a manual block. */
export type ScheduleOccupancy = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  sourceType: "appointment" | "manual";
  appointmentId: number | null;
};

/**
 * Defines the psychologist calendar type.
 */

export type PsychologistCalendar = {
  /** One-time availability blocks for the psychologist. */
  availability: ScheduleBlock[];
  /** Appointments and occupancy intervals within those blocks. */
  occupancy: ScheduleOccupancy[];
};

/** Day interval represented as minutes from midnight. */
export type TimeRange = {
  start: number;
  end: number;
};

/**
 * Defines the day appointment type.
 */

export type DayAppointment = TimeRange & {
  appointmentId: number | null;
};

/** Daily availability, occupancy, and remaining free intervals. */
export type DaySummary = {
  /** AAAA-MM-DD. */
  date: string;
  blocks: TimeRange[];
  appointments: DayAppointment[];
  free: TimeRange[];
};

/**
 * Defines the day status type.
 */

export type DayStatus = "free" | "full" | "none";