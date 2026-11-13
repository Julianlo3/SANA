/**
 * Defines content roles.
 */
export const CONTENT_ROLES = ["administrador", "marketing"];

/**
 * Defines public content tag.
 */
export const PUBLIC_CONTENT_TAG = "public-content";
/**
 * Defines public news tag.
 */
export const PUBLIC_NEWS_TAG = "public-news";
/**
 * Defines public gallery tag.
 */
export const PUBLIC_GALLERY_TAG = "public-gallery";

/**
 * Defines public tags.
 */
export const PUBLIC_TAGS = [
  PUBLIC_CONTENT_TAG,
  PUBLIC_NEWS_TAG,
  PUBLIC_GALLERY_TAG,
] as const;
/**
 * Defines the public tag type.
 */

export type PublicTag = (typeof PUBLIC_TAGS)[number];
