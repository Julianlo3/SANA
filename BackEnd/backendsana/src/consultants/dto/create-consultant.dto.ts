import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const IDENTITY_DOCUMENT_PATTERN = /^\d{6,12}$/;
const PHONE_PATTERN = /^\d{7,10}$/;

/**
 * DTO for creating a new consultant
 */
export class CreateConsultantDto {
  @IsNotEmpty({ message: 'fullName is required' })
  @MaxLength(100)
  fullName!: string;

  @IsEnum(['CC', 'TI', 'CE'] as const, {
    message: 'cardType must be CC, TI or CE',
  })
  cardType!: 'CC' | 'TI' | 'CE';

  @IsNotEmpty({ message: 'identityDocument is required' })
  @Matches(IDENTITY_DOCUMENT_PATTERN, {
    message: 'identityDocument must contain between 6 and 12 digits',
  })
  identityDocument!: string;

  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(100)
  email!: string;

  @IsNotEmpty({ message: 'phone is required' })
  @Matches(PHONE_PATTERN, {
    message: 'phone must contain between 7 and 10 digits',
  })
  phone!: string;

  @IsNotEmpty({ message: 'birthdate is required' })
  @IsDateString({}, { message: 'birthdate must be a valid date (YYYY-MM-DD)' })
  birthdate!: string;

  @IsEnum(['F', 'M', 'O', 'P'] as const, {
    message: 'gender must be F, M, O or P',
  })
  gender!: 'F' | 'M' | 'O' | 'P';

  @IsBoolean()
  termsAccepted!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  residenceZone?: string;
}
