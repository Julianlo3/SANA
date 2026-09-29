export const CONTENT_ROLES = ["administrador", "marketing"];

export const PUBLIC_CONTENT_TAG = "public-content";
export const PUBLIC_NEWS_TAG = "public-news";
export const PUBLIC_GALLERY_TAG = "public-gallery";

export const PUBLIC_TAGS = [
  PUBLIC_CONTENT_TAG,
  PUBLIC_NEWS_TAG,
  PUBLIC_GALLERY_TAG,
] as const;
export type PublicTag = (typeof PUBLIC_TAGS)[number];
