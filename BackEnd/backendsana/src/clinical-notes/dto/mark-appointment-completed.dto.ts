import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * DTO for marking an appointment as completed (realizada)
 */
export class MarkAppointmentCompletedDto {
  @IsBoolean()
  @IsNotEmpty()
  completed!: boolean;
}
