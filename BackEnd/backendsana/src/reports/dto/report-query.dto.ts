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
  /** Selects a predefined reporting period. */
  @IsOptional()
  @IsEnum(ReportPreset, {
    message:
      'preset debe ser uno de: today, last_7_days, last_month, last_3_months, current_year, custom',
  })
  preset?: ReportPreset;

  /** Inclusive start date in ISO-8601 format for a custom period. */
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'startDate debe ser una fecha válida en formato ISO (YYYY-MM-DD o ISO8601)',
    },
  )
  startDate?: string;

  /** Inclusive end date in ISO-8601 format for a custom period. */
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
  /** Chooses whether the report groups appointments by scheduled or creation date. */
  @IsOptional()
  @IsEnum(AppointmentDateBasis, {
    message: 'dateBasis debe ser scheduled o created',
  })
  dateBasis?: AppointmentDateBasis = AppointmentDateBasis.Scheduled;

  /** Filters appointments by their current state. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  state?: string;

  /** Filters appointments by modality. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  modality?: string;

  /** Filters appointments by kind. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  kind?: string;

  /** Filters results to a psychologist identifier. */
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
  /** Filters results to a psychologist identifier. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  psyId?: number;

  /** Filters appointments by modality. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  modality?: string;

  /** Filters appointments by kind. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  kind?: string;
}

/**
 * Query parameters for the Donations History report.
 */
export class DonationsHistoryQueryDto extends BaseReportQueryDto {
  /** Filters donations by transaction status. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  status?: string;

  /** Filters donations by payment method. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;
}

/**
 * Query parameters for the Donations Evolution and Contributions report.
 */
export class DonationsEvolutionQueryDto extends BaseReportQueryDto {
  /** Filters donations by payment method. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;
}
