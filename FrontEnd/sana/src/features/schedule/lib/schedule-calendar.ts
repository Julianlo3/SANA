import type {
  RecurringScheduleBlock,
  ScheduleBlock,
} from "../types/schedule-types";
import type { CalendarEvent } from "../types/calendar-types";

/** Arma un Date local a partir de una fecha (AAAA-MM-DD) y una hora (HH:mm o HH:mm:ss). */
function toDate(date: string, time: string): Date {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

/** Convierte los bloqueos puntuales a eventos del calendario. */
export function blocksToEvents(blocks: ScheduleBlock[]): CalendarEvent[] {
  return blocks.map((block) => ({
    title:
      block.appointmentId !== null
        ? "Cita asignada"
        : (block.reason ?? "Disponible"),
    start: toDate(block.date, block.startTime),
    end: toDate(block.date, block.endTime),
    resource: {
      kind: block.appointmentId !== null ? "appointment" : "block",
      id: block.id,
      reason: block.reason,
    },
  }));
}

/**
 * Convierte las reglas recurrentes a eventos repetidos, generando una
 * ocurrencia por semana dentro del rango [rangeStart, rangeEnd] visible
 * en el calendario. react-big-calendar no soporta reglas de repetición
 * nativas sin una librería adicional (rrule), así que se expanden a mano.
 */
export function recurringBlocksToEvents(
  rules: RecurringScheduleBlock[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;

    const validFrom = new Date(rule.validFrom);
    const validUntil = rule.validUntil ? new Date(rule.validUntil) : null;

    const cursor = new Date(rangeStart);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= rangeEnd) {
      // ISO: 1 = lunes ... 7 = domingo, igual que getDay() ajustado.
      const isoDayOfWeek = cursor.getDay() === 0 ? 7 : cursor.getDay();

      if (
        isoDayOfWeek === rule.dayOfWeek &&
        cursor >= validFrom &&
        (!validUntil || cursor <= validUntil)
      ) {
        const dateStr = cursor.toISOString().slice(0, 10);
        events.push({
          title: rule.reason ?? "Disponible (recurrente)",
          start: toDate(dateStr, rule.startTime),
          end: toDate(dateStr, rule.endTime),
          resource: { kind: "recurring", id: rule.id, reason: rule.reason },
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return events;
}