import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO for registering attention with optional observation
 */
export class RegisterAttentionDto {
  @IsInt()
  @IsNotEmpty()
  appId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'La observación no puede exceder 5000 caracteres' })
  observation?: string;

  @IsBoolean()
  @IsNotEmpty()
  termsAccepted!: boolean;
}
