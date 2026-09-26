import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * DTO for creating a recurring schedule block, containing the day of the week, start and end times, validity period, and reason.
 */
export class CreateRecurringScheduleBlockDto {
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @Matches(TIME_PATTERN)
  startTime!: string;

  @Matches(TIME_PATTERN)
  endTime!: string;

  @IsDateString()
  validFrom!: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsString()
  @MaxLength(255)
  reason!: string;
}
