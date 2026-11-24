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

export const MIN_CARE_PACKAGE_SESSIONS = 3;
export const MAX_CARE_PACKAGE_SESSIONS = 12;

export class SuggestCarePackageDto {
  @IsInt()
  @IsPositive()
  assessmentAppointmentId!: number;

  @IsInt()
  @Min(MIN_CARE_PACKAGE_SESSIONS, {
    message: `El paquete debe tener mínimo ${MIN_CARE_PACKAGE_SESSIONS} sesiones`,
  })
  @Max(MAX_CARE_PACKAGE_SESSIONS, {
    message: `El paquete debe tener máximo ${MAX_CARE_PACKAGE_SESSIONS} sesiones`,
  })
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
  @Min(MIN_CARE_PACKAGE_SESSIONS, {
    message: `El paquete debe tener mínimo ${MIN_CARE_PACKAGE_SESSIONS} sesiones`,
  })
  @Max(MAX_CARE_PACKAGE_SESSIONS, {
    message: `El paquete debe tener máximo ${MAX_CARE_PACKAGE_SESSIONS} sesiones`,
  })
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
  @Min(MIN_CARE_PACKAGE_SESSIONS, {
    message: `El paquete debe tener mínimo ${MIN_CARE_PACKAGE_SESSIONS} sesiones`,
  })
  @Max(MAX_CARE_PACKAGE_SESSIONS, {
    message: `El paquete debe tener máximo ${MAX_CARE_PACKAGE_SESSIONS} sesiones`,
  })
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

