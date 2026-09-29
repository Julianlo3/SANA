export const CONTENT_ITEM_KEYS = ['about.mission', 'about.vision'] as const;
export type ContentItemKey = (typeof CONTENT_ITEM_KEYS)[number];

export const CONTENT_CARD_SECTIONS = [
  'values',
  'team',
  'services',
  'programs',
] as const;
export type ContentCardSection = (typeof CONTENT_CARD_SECTIONS)[number];

export const CONTENT_TYPES = [
  'content_item',
  'content_card',
  'news',
  'gallery_image',
  'banner',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export type ContentAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'retire'
  | 'activate'
  | 'deactivate'
  | 'pin'
  | 'unpin';

export const CONTENT_TEXT_MAX_LENGTH = 2000;
export const CARD_DESCRIPTION_MAX_LENGTH = 1000;

export const CLOUDINARY_IMAGE_URL_PATTERN =
  /^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/[^\s"'<>]+$/i;
