import { IsDateString, IsInt, IsPositive } from 'class-validator';

/**
 * DTO for assigning a psychologist and provisional time slot to an appointment request.
 */
export class AssignAppointmentDto {
  @IsInt()
  @IsPositive()
  psyId!: number;

  @IsDateString()
  appDate!: string;

  @IsInt()
  @IsPositive()
  appDuration!: number;
}
