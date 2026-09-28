import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a clinical note
 */
export class CreateClinicalNoteDto {
  @IsInt()
  @IsNotEmpty()
  appId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'La observación no puede exceder 5000 caracteres' })
  cnObservation?: string;

  @IsBoolean()
  @IsNotEmpty()
  cnTermsAccepted!: boolean;
}
