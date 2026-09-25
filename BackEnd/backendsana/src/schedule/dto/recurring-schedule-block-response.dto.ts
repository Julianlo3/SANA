export interface RecurringScheduleBlockResponse {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string | null;
  reason: string | null;
  active: boolean;
}
