import { IsEnum } from 'class-validator';

export type AppointmentStatusUpdate = 'cancelada' | 'realizada';

/** 
 * DTO for the secretary or system to change the status of an appointment. 
*/
export class UpdateAppointmentStatusDto {
  @IsEnum(['cancelada', 'realizada'] as const)
  state!: AppointmentStatusUpdate;
}
