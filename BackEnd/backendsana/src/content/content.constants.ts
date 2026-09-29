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

export const NEWS_TITLE_MAX_LENGTH = 150;
export const NEWS_BODY_MAX_LENGTH = 10000;
export const IMAGE_ALT_MAX_LENGTH = 150;
export const GALLERY_CAPTION_MAX_LENGTH = 200;

export const PUBLICATION_STATUSES = ['published', 'retired'] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_FORMATS = ['jpg', 'png', 'webp'] as const;
export const IMAGE_FOLDERS = ['content', 'news', 'gallery', 'banners'] as const;
export const BANNER_TITLE_MAX_LENGTH = 120;
export const DEFAULT_MAX_ACTIVE_BANNERS = 5;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];

export const CLOUDINARY_IMAGE_URL_PATTERN =
  /^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/[^\s"'<>]+$/i;
