export interface ScheduleAvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  psychologists: Array<{
    id: number;
    name: string;
    speciality: string;
  }>;
}
