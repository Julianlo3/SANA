export interface ScheduleBlockResponse {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  appointmentId: number | null;
}
