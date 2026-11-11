import { IsEnum } from 'class-validator';

export type AppointmentStatusUpdate = 'cancelada' | 'no_asistio';

/**
 * DTO for updating the status of an appointment.
 */
export class UpdateAppointmentStatusDto {
  @IsEnum(['cancelada', 'no_asistio'] as const)
  state!: AppointmentStatusUpdate;
}
