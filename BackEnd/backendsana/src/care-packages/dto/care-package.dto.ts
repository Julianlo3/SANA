import { IsEnum, IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
export class CreateCarePackageDto { @IsInt() @IsPositive() assessmentAppointmentId!: number; @IsInt() @IsPositive() sessionLimit!: number; @IsEnum(['alta','media','baja'] as const) priority!: 'alta'|'media'|'baja'; }
export class SchedulePackageAppointmentDto { @IsString() appDate!: string; }
export class CloseCarePackageDto { @IsOptional() @IsString() @MaxLength(1000) reason?: string; }
