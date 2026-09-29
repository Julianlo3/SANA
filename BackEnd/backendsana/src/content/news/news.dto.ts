import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  CLOUDINARY_IMAGE_URL_PATTERN,
  IMAGE_ALT_MAX_LENGTH,
  NEWS_BODY_MAX_LENGTH,
  NEWS_TITLE_MAX_LENGTH,
  PUBLICATION_STATUSES,
  type PublicationStatus,
} from '../content.constants.js';
import type { ContentEditor } from '../dto/content-response.dto.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const isPresent = (_: unknown, value: unknown) =>
  value !== null && value !== undefined;

/**
 * DTO for publishing a news item. The publication date is set by the server.
 */
export class CreateNewsDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'title must not be empty' })
  @MaxLength(NEWS_TITLE_MAX_LENGTH)
  title!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'body must not be empty' })
  @MaxLength(NEWS_BODY_MAX_LENGTH)
  body!: string;

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
}

/**
 * DTO for editing a news item; `null` removes the image.
 */
export class UpdateNewsDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'title must not be empty' })
  @MaxLength(NEWS_TITLE_MAX_LENGTH)
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'body must not be empty' })
  @MaxLength(NEWS_BODY_MAX_LENGTH)
  body?: string;

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
}

export class UpdatePublicationStatusDto {
  @IsIn(PUBLICATION_STATUSES, {
    message: `status must be one of: ${PUBLICATION_STATUSES.join(', ')}`,
  })
  status!: PublicationStatus;
}

export class UpdateNewsPinDto {
  @IsBoolean()
  isPinned!: boolean;
}

export class PublicNewsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;
}

export interface NewsResponse {
  id: number;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
  status: PublicationStatus;
  isPinned: boolean;
  publishedAt: Date;
  createdBy: ContentEditor;
  updatedAt: Date;
  updatedBy: ContentEditor;
}

export type PublicNews = Pick<
  NewsResponse,
  'id' | 'title' | 'body' | 'imageUrl' | 'imageAlt' | 'isPinned' | 'publishedAt'
>;

export interface PublicNewsPage {
  items: PublicNews[];
  total: number;
  page: number;
  limit: number;
}
