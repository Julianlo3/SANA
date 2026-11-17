import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO for querying summarized schedule availability without psychologist information.
 */
export class PublicScheduleAvailabilityQueryDto {
  /** Optional ISO-8601 date and time from which to search for available slots. */
  @IsOptional()
  @IsDateString({}, { message: 'appointmentStart debe tener formato de fecha válido (ISO)' })
  appointmentStart?: string;

  /** Appointment length in minutes; defaults to 60. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  duration?: number = 60;

  /** Number of hours after the start time to include; defaults to 24. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  delayHours?: number = 24;
}

