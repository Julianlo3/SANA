import type { AppointmentMode } from "@/features/appointments/types/appointment-types";

/**
 * Calendar event types consumed by the psychologist schedule calendar.
 */
/**
 * Event metadata used to distinguish availability from appointments.
 */
export type CalendarEventResource =
  | {
      kind: "block" | "recurring";
      id: number;
    }
  | {
      kind: "appointment";
      id: number;
      patientName?: string;
      mode?: AppointmentMode;
    };

/**
 * Event shape required by react-big-calendar.
 */
export type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEventResource;
};