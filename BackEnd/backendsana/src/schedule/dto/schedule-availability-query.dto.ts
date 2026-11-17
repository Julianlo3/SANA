import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * DTO for querying slots from the appointment start through a forward delay window.
 */
export class ScheduleAvailabilityQueryDto {
  /** ISO-8601 date and time from which to search for available slots. */
  @IsDateString()
  appointmentStart!: string;

  /** Appointment length in minutes. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  duration!: number;

  /** Number of hours after the start time to include in the search window. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  delayHours!: number;

  /** Optional comma-separated psychologist identifiers to include. */
  @IsOptional()
  @IsString()
  psychologistIds?: string;
}
