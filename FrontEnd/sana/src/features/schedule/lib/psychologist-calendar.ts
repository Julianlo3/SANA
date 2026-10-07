import type { CalendarEvent } from "../types/calendar-types";
import type {
  DayStatus,
  DaySummary,
  PsychologistCalendar,
  TimeRange,
} from "../types/psychologist-calendar-types";

/** Toda cita dura una hora: un hueco más corto no cuenta como espacio. */
const APPOINTMENT_MINUTES = 60;

/** "HH:mm" o "HH:mm:ss" a minutos desde la medianoche. */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Minutos desde la medianoche a "HH:mm". */
export function formatMinutes(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const rest = String(minutes % 60).padStart(2, "0");
  return `${hours}:${rest}`;
}

/** AAAA-MM-DD de un Date, en hora local. */
export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDate(key: string, minutes: number): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60);
}

/** Resta los intervalos ocupados de los bloques y deja solo los huecos útiles. */
function subtract(blocks: TimeRange[], busy: TimeRange[]): TimeRange[] {
  const sortedBusy = [...busy].sort((a, b) => a.start - b.start);
  const free: TimeRange[] = [];

  for (const block of blocks) {
    let cursor = block.start;

    for (const item of sortedBusy) {
      if (item.end <= cursor || item.start >= block.end) continue;
      if (item.start > cursor) free.push({ start: cursor, end: item.start });
      cursor = Math.max(cursor, item.end);
    }

    if (cursor < block.end) free.push({ start: cursor, end: block.end });
  }

  return free.filter((range) => range.end - range.start >= APPOINTMENT_MINUTES);
}

/** Agrupa el calendario del backend por día. */
export function summarizeDays(
  calendar: PsychologistCalendar,
): Map<string, DaySummary> {
  const days = new Map<string, DaySummary>();

  function getDay(date: string): DaySummary {
    const key = date.slice(0, 10);
    const existing = days.get(key);
    if (existing) return existing;

    const created: DaySummary = {
      date: key,
      blocks: [],
      appointments: [],
      free: [],
    };
    days.set(key, created);
    return created;
  }

  for (const block of calendar.availability) {
    getDay(block.date).blocks.push({
      start: toMinutes(block.startTime),
      end: toMinutes(block.endTime),
    });
  }

  for (const item of calendar.occupancy) {
    getDay(item.date).appointments.push({
      start: toMinutes(item.startTime),
      end: toMinutes(item.endTime),
      appointmentId: item.appointmentId,
    });
  }

  for (const day of days.values()) {
    day.blocks.sort((a, b) => a.start - b.start);
    day.appointments.sort((a, b) => a.start - b.start);
    day.free = subtract(day.blocks, day.appointments);
  }

  return days;
}

/** Si el día tiene espacio, está lleno, o el psicólogo no abrió disponibilidad. */
export function dayStatus(summary: DaySummary | undefined): DayStatus {
  if (!summary || summary.blocks.length === 0) return "none";
  return summary.free.length > 0 ? "free" : "full";
}

/**
 * Un evento por tipo y por día, para que la vista de mes quede limpia:
 * "Con espacio" si queda al menos una hora libre, y "N citas" si hay citas.
 */
export function summariesToEvents(
  days: Map<string, DaySummary>,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const day of days.values()) {
    if (day.free.length > 0) {
      events.push({
        title: "Con espacio",
        start: toDate(day.date, 0),
        end: toDate(day.date, 60),
        resource: { kind: "block", id: 0, reason: null },
      });
    }

    if (day.appointments.length > 0) {
      const count = day.appointments.length;
      events.push({
        title: `${count} ${count === 1 ? "cita" : "citas"}`,
        start: toDate(day.date, 0),
        end: toDate(day.date, 60),
        resource: { kind: "appointment", id: 0, reason: null },
      });
    }
  }

  return events;
}