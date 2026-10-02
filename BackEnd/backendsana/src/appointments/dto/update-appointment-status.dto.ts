import { IsEnum } from 'class-validator';

export type AppointmentStatusUpdate = 'cancelada';

/**
 * DTO for updating the status of an appointment.
 */
export class UpdateAppointmentStatusDto {
  @IsEnum(['cancelada'] as const)
  state!: AppointmentStatusUpdate;
}
