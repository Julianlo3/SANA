import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  BANNER_TITLE_MAX_LENGTH,
  CLOUDINARY_IMAGE_URL_PATTERN,
  IMAGE_ALT_MAX_LENGTH,
} from '../content.constants.js';
import type { ContentEditor } from '../dto/content-response.dto.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const isPresent = (_: unknown, value: unknown) =>
  value !== null && value !== undefined;

/**
 * DTO for creating a banner. It can be saved as a draft without image or period.
 */
export class CreateBannerDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'title must not be empty' })
  @MaxLength(BANNER_TITLE_MAX_LENGTH)
  title!: string;

  @IsOptional()
  @Matches(CLOUDINARY_IMAGE_URL_PATTERN, {
    message: 'imageUrl must be an image uploaded to the project storage',
  })
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(IMAGE_ALT_MAX_LENGTH)
  imageAlt?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'startsAt must be a valid date' })
  startsAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'endsAt must be a valid date' })
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO for editing a banner; `null` clears the image or the period.
 */
export class UpdateBannerDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'title must not be empty' })
  @MaxLength(BANNER_TITLE_MAX_LENGTH)
  title?: string;

  @ValidateIf(isPresent)
  @Matches(CLOUDINARY_IMAGE_URL_PATTERN, {
    message: 'imageUrl must be an image uploaded to the project storage',
  })
  @MaxLength(500)
  imageUrl?: string | null;

  @ValidateIf(isPresent)
  @Transform(trim)
  @IsString()
  @MaxLength(IMAGE_ALT_MAX_LENGTH)
  imageAlt?: string | null;

  @ValidateIf(isPresent)
  @IsISO8601({ strict: true }, { message: 'startsAt must be a valid date' })
  startsAt?: string | null;

  @ValidateIf(isPresent)
  @IsISO8601({ strict: true }, { message: 'endsAt must be a valid date' })
  endsAt?: string | null;
}

export class UpdateBannerActivationDto {
  @IsBoolean()
  isActive!: boolean;
}

export type BannerState = 'inactive' | 'scheduled' | 'current' | 'expired';

export interface BannerResponse {
  id: number;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  state: BannerState;
  updatedAt: Date;
  updatedBy: ContentEditor;
}

export interface BannerListResponse {
  items: BannerResponse[];
  activeCount: number;
  maxActive: number;
}

export interface PublicBanner {
  id: number;
  title: string;
  imageUrl: string;
  imageAlt: string;
}
