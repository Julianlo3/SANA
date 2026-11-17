import { IsIn, IsOptional } from 'class-validator';
import {
  CONTENT_CARD_SECTIONS,
  type ContentCardSection,
} from '../content.constants.js';

/**
 * Query parameters for listing content cards in the admin panel.
 */
export class ContentCardsQueryDto {
  /** Optional section used to filter content cards. */
  @IsOptional()
  @IsIn(CONTENT_CARD_SECTIONS, {
    message: `section must be one of: ${CONTENT_CARD_SECTIONS.join(', ')}`,
  })
  section?: ContentCardSection;
}
