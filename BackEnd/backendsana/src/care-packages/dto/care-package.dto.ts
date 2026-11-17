import { Type } from 'class-transformer';
import {
  IsEnum,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Query parameters for package availability over a 30-day window.
 */
export class CarePackageAvailabilityQueryDto {
  /** ISO-8601 datetime from which to search. */
  @IsDateString()
  appointmentStart!: string;

  /** Appointment length in minutes. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  duration!: number;

  /** Number of hours after the start time, up to 30 days. */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  delayHours!: number;
}

export class SuggestCarePackageDto {
  @IsInt()
  @IsPositive()
  assessmentAppointmentId!: number;

  @IsInt()
  @IsPositive()
  sessionLimit!: number;

  @IsEnum(['alta', 'media', 'baja'] as const)
  priority!: 'alta' | 'media' | 'baja';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class CreateCarePackageDto {
  @IsInt()
  @IsPositive()
  assessmentAppointmentId!: number;

  @IsInt()
  @IsPositive()
  sessionLimit!: number;

  @IsEnum(['alta', 'media', 'baja'] as const)
  priority!: 'alta' | 'media' | 'baja';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class ApproveCarePackageDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  sessionLimit?: number;

  @IsOptional()
  @IsEnum(['alta', 'media', 'baja'] as const)
  priority?: 'alta' | 'media' | 'baja';
}

export class RejectCarePackageDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo de rechazo es obligatorio' })
  @MaxLength(1000)
  reason!: string;
}

export class SchedulePackageAppointmentDto {
  @IsString()
  appDate!: string;
}

export class CloseCarePackageDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

