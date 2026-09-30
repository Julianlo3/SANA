import { Transform } from 'class-transformer';
import {
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
  CLOUDINARY_IMAGE_URL_PATTERN,
  GALLERY_CAPTION_MAX_LENGTH,
  IMAGE_ALT_MAX_LENGTH,
  type PublicationStatus,
} from '../content.constants.js';
import type { ContentEditor } from '../dto/content-response.dto.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * DTO for adding an image to the gallery.
 */
export class CreateGalleryImageDto {
  @Matches(CLOUDINARY_IMAGE_URL_PATTERN, {
    message: 'imageUrl must be an image uploaded to the project storage',
  })
  @MaxLength(500)
  imageUrl!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'imageAlt must not be empty' })
  @MaxLength(IMAGE_ALT_MAX_LENGTH)
  imageAlt!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(GALLERY_CAPTION_MAX_LENGTH)
  caption?: string;
}

/**
 * DTO for editing a gallery image; `null` clears the caption.
 */
export class UpdateGalleryImageDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'imageAlt must not be empty' })
  @MaxLength(IMAGE_ALT_MAX_LENGTH)
  imageAlt?: string;

  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Transform(trim)
  @IsString()
  @MaxLength(GALLERY_CAPTION_MAX_LENGTH)
  caption?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export interface GalleryImageResponse {
  id: number;
  imageUrl: string;
  imageAlt: string;
  caption: string | null;
  status: PublicationStatus;
  order: number;
  updatedAt: Date;
  updatedBy: ContentEditor;
}

export type PublicGalleryImage = Pick<
  GalleryImageResponse,
  'id' | 'imageUrl' | 'imageAlt' | 'caption'
>;
