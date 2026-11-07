import { format, startOfDay } from "date-fns";
import type {
  RecurringScheduleBlock,
  ScheduleBlock,
} from "../types/schedule-types";
import type { CalendarEvent } from "../types/calendar-types";

/**
 * Creates a local Date from a date and time string.
 * @param date Date in YYYY-MM-DD format.
 * @param time Time in HH:mm or HH:mm:ss format.
 * @returns The corresponding local Date.
 */
function toDate(date: string, time: string): Date {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Parses an appointment timestamp as a Colombia-local calendar time.
 * @param appDate Appointment datetime from the API.
 * @returns The local appointment start, or null when the value is invalid.
 */
function appointmentStartInBogota(appDate: string): Date | null {
  const dateTimeWithZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(appDate);
  if (!dateTimeWithZone) {
    const match = appDate.match(
      /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/,
    );
    return match ? toDate(match[1], match[2]) : null;
  }

  const instant = new Date(appDate);
  if (Number.isNaN(instant.getTime())) return null;

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  return toDate(
    `${parts.year}-${parts.month}-${parts.day}`,
    `${parts.hour}:${parts.minute}`,
  );
}

/**
 * Converts one-time availability blocks to calendar events.
 * @param blocks Availability blocks to convert.
 * @returns Calendar events for the supplied blocks.
 */
export function blocksToEvents(blocks: ScheduleBlock[]): CalendarEvent[] {
  return blocks.map((block) => ({
    title: "",
    start: toDate(block.date, block.startTime),
    end: toDate(block.date, block.endTime),
    resource: { kind: "block", id: block.id },
  }));
}

/**
 * Converts appointments to events that can overlay availability blocks.
 * @param appointments Appointments to convert.
 * @returns Valid appointment events with their display metadata.
 */
export function appointmentsToEvents(
  appointments: ReadonlyArray<{
    appId: number;
    appDate: string | null;
    appDuration: number | null;
    appType: "presencial" | "virtual";
    patientName: string;
  }>,
): CalendarEvent[] {
  return appointments.flatMap((appointment) => {
    if (
      !appointment.appDate ||
      !appointment.appDuration ||
      appointment.appDuration < 1
    ) {
      return [];
    }

    const start = appointmentStartInBogota(appointment.appDate);
    if (!start) return [];

    return [
      {
        title: "Cita",
        start,
        end: new Date(start.getTime() + appointment.appDuration * 60_000),
        resource: {
          kind: "appointment",
          id: appointment.appId,
          patientName: appointment.patientName,
          mode: appointment.appType,
        },
      },
    ];
  });
}

/**
 * Expands recurring availability rules into events within the visible range.
 * @param rules Recurring rules to expand.
 * @param rangeStart Inclusive start of the visible calendar range.
 * @param rangeEnd Inclusive end of the visible calendar range.
 * @returns Calendar events for matching rule occurrences.
 */
export function recurringBlocksToEvents(
  rules: RecurringScheduleBlock[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;

    const validFrom = rule.validFrom.slice(0, 10);
    const validUntil = rule.validUntil?.slice(0, 10);
    const cursor = startOfDay(rangeStart);
    const lastDay = startOfDay(rangeEnd);

    while (cursor <= lastDay) {
      // ISO weekdays use 1 for Monday through 7 for Sunday.
      const isoDayOfWeek = cursor.getDay() === 0 ? 7 : cursor.getDay();
      const dateStr = format(cursor, "yyyy-MM-dd");

      if (
        isoDayOfWeek === rule.dayOfWeek &&
        dateStr >= validFrom &&
        (!validUntil || dateStr <= validUntil)
      ) {
        events.push({
          title: "",
          start: toDate(dateStr, rule.startTime),
          end: toDate(dateStr, rule.endTime),
          resource: { kind: "recurring", id: rule.id },
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return events;
}