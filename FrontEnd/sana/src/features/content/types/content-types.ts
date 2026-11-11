/**
 * Defines the content item key type.
 */

export type ContentItemKey = "about.mission" | "about.vision";

/**
 * Defines the content card section type.
 */

export type ContentCardSection = "values" | "team" | "services" | "programs";

/**
 * Defines the content editor type.
 */

export type ContentEditor = {
  id: number;
  name: string;
};

/**
 * Defines the content item type.
 */

export type ContentItem = {
  key: ContentItemKey;
  value: string | null;
  updatedAt: string | null;
  updatedBy: ContentEditor | null;
};

/**
 * Defines the content card type.
 */

export type ContentCard = {
  id: number;
  section: ContentCardSection;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  order: number;
  isActive: boolean;
  teamGroup: TeamGroup | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  photoCrop: PhotoCrop | null;
  updatedAt: string;
  updatedBy: ContentEditor;
};

/**
 * Defines the team group type.
 */

export type TeamGroup = "staff" | "professional";

/** Area of the original photo shown in the circle, as percentages of its width and height. */
export type PhotoCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Defines the content card payload type.
 */

export type ContentCardPayload = {
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  isActive: boolean;
  teamGroup?: TeamGroup;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  photoCrop?: PhotoCrop | null;
};

/**
 * Defines the publication status type.
 */

export type PublicationStatus = "published" | "retired";

/**
 * Defines the image folder type.
 */

export type ImageFolder = "content" | "news" | "gallery" | "banners";

/**
 * Defines the banner type.
 */

export type Banner = {
  id: number;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  isActive: boolean;
  updatedAt: string;
  updatedBy: ContentEditor;
};

/**
 * Defines the banner list type.
 */

export type BannerList = {
  items: Banner[];
  activeCount: number;
  maxActive: number;
};

/**
 * Defines the banner payload type.
 */

export type BannerPayload = {
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

/**
 * Defines the public banner type.
 */

export type PublicBanner = {
  id: number;
  title: string;
  imageUrl: string;
  imageAlt: string;
};

/**
 * Defines the news type.
 */

export type News = {
  id: number;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
  status: PublicationStatus;
  isPinned: boolean;
  publishedAt: string;
  createdBy: ContentEditor;
  updatedAt: string;
  updatedBy: ContentEditor;
};

/**
 * Defines the news payload type.
 */

export type NewsPayload = {
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

/**
 * Defines the public news type.
 */

export type PublicNews = Pick<
  News,
  "id" | "title" | "body" | "imageUrl" | "imageAlt" | "isPinned" | "publishedAt"
>;

/** Light version of a news item sent to client components; the body never leaves the server. */
export type NewsTeaser = Pick<
  PublicNews,
  "id" | "title" | "imageUrl" | "imageAlt" | "isPinned" | "publishedAt"
> & { excerpt: string };

/**
 * Defines the public news page type.
 */

export type PublicNewsPage = {
  items: PublicNews[];
  total: number;
  page: number;
  limit: number;
};

/**
 * Defines the gallery image type.
 */

export type GalleryImage = {
  id: number;
  imageUrl: string;
  imageAlt: string;
  caption: string | null;
  status: PublicationStatus;
  order: number;
  updatedAt: string;
  updatedBy: ContentEditor;
};

/**
 * Defines the public gallery image type.
 */

export type PublicGalleryImage = Pick<
  GalleryImage,
  "id" | "imageUrl" | "imageAlt" | "caption"
>;

/**
 * Defines the image upload signature type.
 */

export type ImageUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  maxBytes: number;
};

/**
 * Defines the public content card type.
 */

export type PublicContentCard = Pick<
  ContentCard,
  "id" | "title" | "subtitle" | "description" | "imageUrl" | "imageAlt"
>;

/**
 * Defines the public team card type.
 */

export type PublicTeamCard = PublicContentCard & {
  teamGroup: TeamGroup;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  photoCrop: PhotoCrop | null;
};

/**
 * Defines the public content type.
 */

export type PublicContent = {
  mission: string | null;
  vision: string | null;
  values: PublicContentCard[];
  team: PublicTeamCard[];
  services: PublicContentCard[];
  programs: PublicContentCard[];
};
