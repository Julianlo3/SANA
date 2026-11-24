import { IsDateString, IsIn, IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

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

  @IsOptional()
  @IsIn(['presencial', 'virtual'], {
    message: 'La modalidad de la cita debe ser presencial o virtual',
  })
  appType?: 'presencial' | 'virtual';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reassignmentReason?: string;
}
