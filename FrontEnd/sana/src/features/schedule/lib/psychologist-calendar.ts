import type { CalendarEvent } from "../types/calendar-types";
import type { PsychologistCalendar } from "../types/psychologist-calendar-types";

/** Arma un Date local a partir de una fecha (AAAA-MM-DD) y una hora (HH:mm o HH:mm:ss). */
function toDate(date: string, time: string): Date {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Convierte la respuesta del backend en eventos del calendario: los bloques
 * de disponibilidad como "block" y las citas u ocupaciones como "appointment".
 */
export function calendarToEvents(calendar: PsychologistCalendar): CalendarEvent[] {
  const availability: CalendarEvent[] = calendar.availability.map((block) => ({
    title: "Disponible",
    start: toDate(block.date, block.startTime),
    end: toDate(block.date, block.endTime),
    resource: { kind: "block", id: block.id, reason: block.reason },
  }));

  const occupancy: CalendarEvent[] = calendar.occupancy.map((item) => ({
    title:
      item.appointmentId !== null ? `Cita #${item.appointmentId}` : "Ocupado",
    start: toDate(item.date, item.startTime),
    end: toDate(item.date, item.endTime),
    resource: { kind: "appointment", id: item.id, reason: null },
  }));

  return [...availability, ...occupancy];
}