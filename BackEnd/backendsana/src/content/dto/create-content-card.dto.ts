import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CARD_DESCRIPTION_MAX_LENGTH,
  CLOUDINARY_IMAGE_URL_PATTERN,
  CONTENT_CARD_SECTIONS,
  type ContentCardSection,
} from '../content.constants.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * DTO for creating a card in one of the institutional content sections.
 */
export class CreateContentCardDto {
  @IsIn(CONTENT_CARD_SECTIONS, {
    message: `section must be one of: ${CONTENT_CARD_SECTIONS.join(', ')}`,
  })
  section!: ContentCardSection;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'title must not be empty' })
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  subtitle?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(CARD_DESCRIPTION_MAX_LENGTH)
  description?: string;

  @IsOptional()
  @Matches(CLOUDINARY_IMAGE_URL_PATTERN, {
    message: 'imageUrl must be an image uploaded to the project storage',
  })
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  imageAlt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
