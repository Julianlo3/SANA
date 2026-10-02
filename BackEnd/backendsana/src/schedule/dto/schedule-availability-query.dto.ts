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
  @IsDateString()
  appointmentStart!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  duration!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  delayHours!: number;

  @IsOptional()
  @IsString()
  psychologistIds?: string;
}
