import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const PHONE_PATTERN = /^\d{7,12}$/;

export class UpdateOwnProfileDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Matches(PHONE_PATTERN, {
    message: 'phone must contain between 7 and 12 digits',
  })
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'birthdate must be a valid date (YYYY-MM-DD)' })
  birthdate?: string | null;

  @IsOptional()
  @IsEnum(['F', 'M', 'O', 'P'] as const, {
    message: 'gender must be F, M, O or P',
  })
  gender?: 'F' | 'M' | 'O' | 'P' | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  residenceZone?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(75, { each: true })
  vulnerabilities?: string[] | null;
}
