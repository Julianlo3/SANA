import { IsDateString, IsInt, IsOptional, IsPositive } from 'class-validator';

/** 
 * DTO for the secretary to confirm an appointment request.
 * The secretary assigns the psychologist, the definitive date and duration.
 */
export class ConfirmAppointmentDto {
  @IsInt()
  @IsPositive()
  psyId!: number;

  @IsDateString()
  appDate!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  appDuration?: number;
}
