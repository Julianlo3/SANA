import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

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

