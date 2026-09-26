import { IsDateString, IsString, Matches, MaxLength } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * DTO for creating a schedule block, containing the date, start and end times, and reason.
 */
export class CreateScheduleBlockDto {
  @IsDateString({}, { message: 'date debe ser una fecha válida (YYYY-MM-DD)' })
  date!: string;

  @Matches(TIME_PATTERN, {
    message: 'startTime debe tener formato HH:mm o HH:mm:ss',
  })
  startTime!: string;

  @Matches(TIME_PATTERN, {
    message: 'endTime debe tener formato HH:mm o HH:mm:ss',
  })
  endTime!: string;

  @IsString()
  @MaxLength(255)
  reason!: string;
}
