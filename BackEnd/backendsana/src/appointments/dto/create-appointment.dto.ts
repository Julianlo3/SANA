import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export type PatientType = 'self' | 'dependent';
export type CardType = 'CC' | 'TI' | 'CE';
export type GenderType = 'F' | 'M' | 'O' | 'P';

//F=Femenino, M=Masculino, O=Otros, P=Prefiero no definir
export const GENDER_VALUES = ['F', 'M', 'O', 'P'] as const;


const IDENTITY_DOCUMENT_PATTERN = /^\d{6,12}$/;
const PHONE_PATTERN = /^\d{7,12}$/;

/** 
 * DTO for the public appointment request form.
 * The consultant identifies themselves by their identity document and card type.
 */
export class CreateAppointmentDto {
  @IsString()
  @MaxLength(100)
  requesterName!: string;

  @IsEnum(['CC', 'TI', 'CE'] as const, {
    message: 'requesterCardType debe ser CC, TI o CE',
  })
  requesterCardType!: CardType;

  @Matches(IDENTITY_DOCUMENT_PATTERN, {
    message: 'requesterIdentityDocument debe tener entre 6 y 12 dígitos',
  })
  requesterIdentityDocument!: string;

  @Matches(PHONE_PATTERN, {
    message: 'requesterContactNumber debe tener entre 7 y 12 dígitos',
  })
  requesterContactNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  requesterEmail?: string;

  @IsOptional()
  @IsDateString({}, { message: 'requesterBirthdate debe ser una fecha válida (YYYY-MM-DD)' })
  requesterBirthdate?: string;

  @IsOptional()
  @IsEnum(GENDER_VALUES, { message: 'requesterGender debe ser F, M, O o P' })
  requesterGender?: GenderType;


  @IsBoolean()
  requesterTermsAccepted!: boolean;

  @IsEnum(['self', 'dependent'] as const)
  patientType!: PatientType;

  // Campos específicos si es dependiente (menor de edad)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dependentName?: string;

  @IsOptional()
  @Matches(IDENTITY_DOCUMENT_PATTERN, {
    message: 'dependentIdentityDocument debe tener entre 6 y 12 dígitos',
  })
  dependentIdentityDocument?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dependentBirthdate debe ser una fecha válida (YYYY-MM-DD)' })
  dependentBirthdate?: string;

  @IsOptional()
  @IsEnum(GENDER_VALUES, { message: 'dependentGender debe ser F, M, O o P' })
  dependentGender?: GenderType;


  @IsOptional()
  @Matches(PHONE_PATTERN, {
    message: 'dependentContactNumber debe tener entre 7 y 12 dígitos',
  })
  dependentContactNumber?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  relationshipId?: number;

  @IsOptional()
  @IsBoolean()
  dependentTermsAccepted?: boolean;

  // Datos propios de la cita
  @IsEnum(['presencial', 'virtual'] as const)
  appType!: 'presencial' | 'virtual';

  @IsOptional()
  @IsDateString({}, { message: 'appDateIdeal debe ser una fecha válida' })
  appDateIdeal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  appReason?: string;
}
