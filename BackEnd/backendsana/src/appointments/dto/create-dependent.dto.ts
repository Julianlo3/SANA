import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { GENDER_VALUES, type GenderType } from './create-appointment.dto.js';

const IDENTITY_DOCUMENT_PATTERN = /^\d{6,12}$/;

/**
 * DTO for registering a minor dependent under the authenticated consultant's account.
 */
export class CreateDependentDto {
  @IsString()
  @IsNotEmpty({ message: 'name es obligatorio' })
  @MaxLength(100)
  name!: string;

  @Matches(IDENTITY_DOCUMENT_PATTERN, {
    message: 'identityDocument debe tener entre 6 y 12 dígitos',
  })
  identityDocument!: string;

  @IsDateString(
    {},
    { message: 'birthdate debe ser una fecha válida (YYYY-MM-DD)' },
  )
  birthdate!: string;

  @IsOptional()
  @IsEnum(GENDER_VALUES, { message: 'gender debe ser F, M, O o P' })
  gender?: GenderType;

  @IsInt()
  @IsPositive()
  relationshipId!: number;
}
