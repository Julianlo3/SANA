import { IsDateString } from 'class-validator';

/**
 * DTO for taking or selecting an available slot for an appointment.
 */
export class TakeSlotDto {
  @IsDateString({}, { message: 'appDate debe ser una fecha/hora válida en formato ISO' })
  appDate!: string;
}

