import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  CONTENT_ITEM_KEYS,
  CONTENT_TEXT_MAX_LENGTH,
  type ContentItemKey,
} from '../content.constants.js';

export class ContentItemValueDto {
  @IsIn(CONTENT_ITEM_KEYS, {
    message: `key must be one of: ${CONTENT_ITEM_KEYS.join(', ')}`,
  })
  key!: ContentItemKey;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'value must not be empty' })
  @MaxLength(CONTENT_TEXT_MAX_LENGTH)
  value!: string;
}

/**
 * DTO for updating one or more single-value content items in a single save.
 */
export class UpdateContentItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(CONTENT_ITEM_KEYS.length)
  @ValidateNested({ each: true })
  @Type(() => ContentItemValueDto)
  items!: ContentItemValueDto[];
}
