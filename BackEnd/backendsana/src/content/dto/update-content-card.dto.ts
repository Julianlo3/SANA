import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  CARD_DESCRIPTION_MAX_LENGTH,
  CLOUDINARY_IMAGE_URL_PATTERN,
} from '../content.constants.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * DTO for updating a content card. The section cannot be changed; `null` clears optional fields.
 */
export class UpdateContentCardDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'title must not be empty' })
  @MaxLength(150)
  title?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  subtitle?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Transform(trim)
  @IsString()
  @MaxLength(CARD_DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Matches(CLOUDINARY_IMAGE_URL_PATTERN, {
    message: 'imageUrl must be an image uploaded to the project storage',
  })
  @MaxLength(500)
  imageUrl?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  imageAlt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
