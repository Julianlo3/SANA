import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { AppointmentDateBasis, ReportPreset } from './report-presets.enum.js';

/**
 * Base query parameters shared by all report endpoints.
 */
export class BaseReportQueryDto {
  @IsOptional()
  @IsEnum(ReportPreset, {
    message:
      'preset debe ser uno de: today, last_7_days, last_month, last_3_months, current_year, custom',
  })
  preset?: ReportPreset;

  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'startDate debe ser una fecha válida en formato ISO (YYYY-MM-DD o ISO8601)',
    },
  )
  startDate?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'endDate debe ser una fecha válida en formato ISO (YYYY-MM-DD o ISO8601)',
    },
  )
  endDate?: string;
}

/**
 * Query parameters for the Appointments Evolution report.
 */
export class AppointmentsReportQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsEnum(AppointmentDateBasis, {
    message: 'dateBasis debe ser scheduled o created',
  })
  dateBasis?: AppointmentDateBasis = AppointmentDateBasis.Scheduled;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  modality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  kind?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  psyId?: number;
}

/**
 * Query parameters for the Attendance report.
 */
export class AttendanceReportQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  psyId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  modality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  kind?: string;
}

/**
 * Query parameters for the Donations History report.
 */
export class DonationsHistoryQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;
}

/**
 * Query parameters for the Donations Evolution and Contributions report.
 */
export class DonationsEvolutionQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;
}
