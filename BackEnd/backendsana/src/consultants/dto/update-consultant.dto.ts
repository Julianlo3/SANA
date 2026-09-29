import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const IDENTITY_DOCUMENT_PATTERN = /^\d{6,12}$/;
const PHONE_PATTERN = /^\d{7,10}$/;

/**
 * DTO for updating a consultant
 */
export class UpdateConsultantDto {
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsEnum(['CC', 'TI', 'CE'] as const, {
    message: 'cardType must be CC, TI or CE',
  })
  cardType?: 'CC' | 'TI' | 'CE';

  @IsOptional()
  @Matches(IDENTITY_DOCUMENT_PATTERN, {
    message: 'identityDocument must contain between 6 and 12 digits',
  })
  identityDocument?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @Matches(PHONE_PATTERN, {
    message: 'phone must contain between 7 and 10 digits',
  })
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'birthdate must be a valid date (YYYY-MM-DD)' })
  birthdate?: string;

  @IsOptional()
  @IsEnum(['F', 'M', 'O', 'P'] as const, {
    message: 'gender must be F, M, O or P',
  })
  gender?: 'F' | 'M' | 'O' | 'P';

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  residenceZone?: string;
}
