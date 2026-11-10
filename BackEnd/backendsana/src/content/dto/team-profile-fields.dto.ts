import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  FACEBOOK_URL_PATTERN,
  INSTAGRAM_URL_PATTERN,
  LINKEDIN_URL_PATTERN,
  SOCIAL_URL_MAX_LENGTH,
  TEAM_GROUPS,
  type TeamGroup,
} from '../content.constants.js';
import { PhotoCropDto } from './photo-crop.dto.js';

const trimToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

const isPresent = (_: object, value: unknown) =>
  value !== null && value !== undefined;

/**
 * Team profile fields shared by the create and update card DTOs; `null` clears an optional field.
 */
export class TeamProfileFieldsDto {
  @IsOptional()
  @IsIn(TEAM_GROUPS, {
    message: `teamGroup must be one of: ${TEAM_GROUPS.join(', ')}`,
  })
  teamGroup?: TeamGroup;

  @Transform(trimToNull)
  @ValidateIf(isPresent)
  @Matches(FACEBOOK_URL_PATTERN, { message: 'facebookUrl must be a facebook.com URL' })
  @MaxLength(SOCIAL_URL_MAX_LENGTH)
  facebookUrl?: string | null;

  @Transform(trimToNull)
  @ValidateIf(isPresent)
  @Matches(INSTAGRAM_URL_PATTERN, { message: 'instagramUrl must be an instagram.com URL' })
  @MaxLength(SOCIAL_URL_MAX_LENGTH)
  instagramUrl?: string | null;

  @Transform(trimToNull)
  @ValidateIf(isPresent)
  @Matches(LINKEDIN_URL_PATTERN, { message: 'linkedinUrl must be a linkedin.com URL' })
  @MaxLength(SOCIAL_URL_MAX_LENGTH)
  linkedinUrl?: string | null;

  @ValidateIf(isPresent)
  @IsObject()
  @ValidateNested()
  @Type(() => PhotoCropDto)
  photoCrop?: PhotoCropDto | null;
}
