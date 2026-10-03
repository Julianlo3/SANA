import type { ScheduleBlockResponse } from './schedule-block-response.dto.js';

export interface ScheduleOccupancyResponse {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  sourceType: 'appointment' | 'manual';
  appointmentId: number | null;
}

export interface ScheduleCalendarResponse {
  availability: ScheduleBlockResponse[];
  occupancy: ScheduleOccupancyResponse[];
}
