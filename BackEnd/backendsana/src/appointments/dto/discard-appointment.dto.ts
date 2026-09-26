import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for discarding an appointment request, containing the reason for discarding.
 */
export class DiscardAppointmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}
