import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ProfessionalDataDto {
  @Matches(/^\d{1,20}$/)
  licenseNumber!: string;

  @IsString()
  @MaxLength(45)
  speciality!: string;

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;
}

const IDENTITY_DOCUMENT_PATTERN = /^\d{6,12}$/;
const PHONE_PATTERN = /^\d{7,10}$/;
const ALLOWED_EMAIL_PATTERN = /@(gmail\.com|googlemail\.com|hotmail\.com|unicauca\.edu\.co)$/i;

export class CreateUserDto {
  @MaxLength(100)
  fullName!: string;

  @IsOptional()
  @IsEnum(['CC', 'TI', 'CE'] as const, {
    message: 'cardType must be CC, TI or CE',
  })
  cardType?: 'CC' | 'TI' | 'CE';

  @Matches(IDENTITY_DOCUMENT_PATTERN, {
    message: 'identityDocument must contain between 6 and 12 digits',
  })
  identityDocument!: string;

  @IsEmail()
  @MaxLength(100)
  @Matches(ALLOWED_EMAIL_PATTERN, {
    message: 'email must be a Gmail, Hotmail or Unicauca account',
  })
  email!: string;

  @Matches(PHONE_PATTERN, {
    message: 'phone must contain between 7 and 10 digits',
  })
  phone!: string;

  @IsOptional()
  @IsDateString({}, { message: 'birthdate must be a valid date (YYYY-MM-DD)' })
  birthdate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1)
  gender?: string;

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  roleId!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfessionalDataDto)
  professionalData?: ProfessionalDataDto;
}
