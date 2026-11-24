import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

/**
 * DTO for a psychologist to refer a valuation appointment to another psychologist.
 */
export class ReferAppointmentDto {
  /** Target psychologist identifier who will receive the referred valuation. */
  @IsInt()
  @IsPositive()
  targetPsychologistId!: number;

  /** Clinical or administrative reason for referring the valuation to another psychologist. */
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'El motivo de remisión no puede exceder 1000 caracteres',
  })
  reason?: string;
}
