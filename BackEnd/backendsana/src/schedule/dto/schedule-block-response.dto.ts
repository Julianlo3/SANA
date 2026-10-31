export interface ScheduleBlockResponse {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  appointmentId: number | null;
}
