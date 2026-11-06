import type { ScheduleBlockResponse } from './schedule-block-response.dto.js';
import type { RecurringScheduleBlockResponse } from './recurring-schedule-block-response.dto.js';

/** Calendar occupancy created by an appointment or a manual block. */
export interface ScheduleOccupancyResponse {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  sourceType: 'appointment' | 'manual';
  appointmentId: number | null;
}

/** Complete calendar payload containing availability, occupancy, and recurrences. */
export interface ScheduleCalendarResponse {
  availability: ScheduleBlockResponse[];
  occupancy: ScheduleOccupancyResponse[];
  recurring: RecurringScheduleBlockResponse[];
}
