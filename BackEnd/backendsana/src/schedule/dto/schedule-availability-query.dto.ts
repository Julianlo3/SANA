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

  @IsInt()
  @Min(1)
  @Max(480)
  duration!: number;

  @IsInt()
  @Min(1)
  @Max(24)
  delayHours!: number;

  @IsOptional()
  @IsString()
  psychologistIds?: string;
}
