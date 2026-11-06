import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO for querying summarized schedule availability without psychologist information.
 */
export class PublicScheduleAvailabilityQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'appointmentStart debe tener formato de fecha válido (ISO)' })
  appointmentStart?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  duration?: number = 60;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  delayHours?: number = 24;
}

