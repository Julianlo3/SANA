/**
 * Tipos para la vista de calendario de "Mi agenda" (react-big-calendar).
 * Convierte ScheduleBlock y RecurringScheduleBlock al formato de evento
 * que la librería espera: título, fecha/hora de inicio y fin como Date.
 */

export type CalendarEventResource = {
  kind: "block" | "recurring" | "appointment";
  id: number;
  reason: string | null;
};

export type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEventResource;
};