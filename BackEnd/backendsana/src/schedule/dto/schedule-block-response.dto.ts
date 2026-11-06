/** One scheduled availability block, optionally occupied by an appointment. */
export interface ScheduleBlockResponse {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  appointmentId: number | null;
}
