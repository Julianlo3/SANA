import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsPositive, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

export class ProfessionalDataDto {
  @Matches(/^\d{1,20}$/)
  licenseNumber!: string;

  @IsString()
  @MaxLength(45)
  speciality!: string;
}

const IDENTITY_DOCUMENT_PATTERN = /^\d{6,12}$/;
const PHONE_PATTERN = /^\d{7,10}$/;
const GOOGLE_EMAIL_PATTERN = /@(gmail\.com|googlemail\.com)$/i;

export class CreateUserDto {
  @MaxLength(100)
  fullName!: string;

  @Matches(IDENTITY_DOCUMENT_PATTERN, {
    message: 'identityDocument must contain between 6 and 12 digits',
  })
  identityDocument!: string;

  @IsEmail()
  @MaxLength(100)
  @Matches(GOOGLE_EMAIL_PATTERN, {
    message: 'email must be a Google account (gmail.com or googlemail.com)',
  })
  email!: string;

  @Matches(PHONE_PATTERN, {
    message: 'phone must contain between 7 and 10 digits',
  })
  phone!: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  roleId!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfessionalDataDto)
  professionalData?: ProfessionalDataDto;
}
