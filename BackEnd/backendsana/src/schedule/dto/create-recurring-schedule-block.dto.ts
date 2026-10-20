import {
  IsDateString,
  IsInt,
  IsOptional,
  Max,
  Matches,
  Min,
} from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * DTO for creating a recurring schedule block, containing the day of the week, time range, and validity period.
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
}
