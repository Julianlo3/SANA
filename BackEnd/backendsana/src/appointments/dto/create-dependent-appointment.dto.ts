import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO for requesting a valuation appointment from the authenticated consultant's
 * profile for one of their registered minor dependents.
 */
export class CreateDependentAppointmentDto {
  @IsEnum(['presencial', 'virtual'] as const, {
    message: 'appType debe ser presencial o virtual',
  })
  appType!: 'presencial' | 'virtual';

  /** Selected evaluation slot (ISO datetime), allowed only for the dependent's first appointment. */
  @IsOptional()
  @IsDateString(
    {},
    { message: 'appDate debe tener formato de fecha/hora válido (ISO)' },
  )
  appDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  appReason?: string;

  @IsBoolean()
  dependentTermsAccepted!: boolean;
}
