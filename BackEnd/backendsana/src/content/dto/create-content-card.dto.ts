import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  CARD_DESCRIPTION_MAX_LENGTH,
  CLOUDINARY_IMAGE_URL_PATTERN,
  CONTENT_CARD_SECTIONS,
  FACEBOOK_URL_PATTERN,
  INSTAGRAM_URL_PATTERN,
  LINKEDIN_URL_PATTERN,
  SOCIAL_URL_MAX_LENGTH,
  TEAM_GROUPS,
  type ContentCardSection,
  type TeamGroup,
} from '../content.constants.js';
import { PhotoCropDto } from './photo-crop.dto.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

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

  @IsOptional()
  @IsIn(TEAM_GROUPS, {
    message: `teamGroup must be one of: ${TEAM_GROUPS.join(', ')}`,
  })
  teamGroup?: TeamGroup;

  @Transform(trimToNull)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Matches(FACEBOOK_URL_PATTERN, { message: 'facebookUrl must be a facebook.com URL' })
  @MaxLength(SOCIAL_URL_MAX_LENGTH)
  facebookUrl?: string | null;

  @Transform(trimToNull)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Matches(INSTAGRAM_URL_PATTERN, { message: 'instagramUrl must be an instagram.com URL' })
  @MaxLength(SOCIAL_URL_MAX_LENGTH)
  instagramUrl?: string | null;

  @Transform(trimToNull)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Matches(LINKEDIN_URL_PATTERN, { message: 'linkedinUrl must be a linkedin.com URL' })
  @MaxLength(SOCIAL_URL_MAX_LENGTH)
  linkedinUrl?: string | null;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => PhotoCropDto)
  photoCrop?: PhotoCropDto | null;
}
