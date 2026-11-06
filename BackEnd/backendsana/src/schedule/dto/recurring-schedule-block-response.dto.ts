/** Recurring weekly availability block displayed in a psychologist calendar. */
export interface RecurringScheduleBlockResponse {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string | null;
  active: boolean;
  hasAppointments: boolean;
}
