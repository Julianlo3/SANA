export type ContentItemKey = "about.mission" | "about.vision";

export type ContentCardSection = "values" | "team" | "services" | "programs";

export type ContentEditor = {
  id: number;
  name: string;
};

export type ContentItem = {
  key: ContentItemKey;
  value: string | null;
  updatedAt: string | null;
  updatedBy: ContentEditor | null;
};

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
  updatedAt: string;
  updatedBy: ContentEditor;
};

export type ContentCardPayload = {
  title: string;
  subtitle: string | null;
  description: string | null;
  isActive: boolean;
};

export type PublicationStatus = "published" | "retired";

export type ImageFolder = "content" | "news" | "gallery" | "banners";

export type BannerState = "inactive" | "scheduled" | "current" | "expired";

export type Banner = {
  id: number;
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  state: BannerState;
  updatedAt: string;
  updatedBy: ContentEditor;
};

export type BannerList = {
  items: Banner[];
  activeCount: number;
  maxActive: number;
};

export type BannerPayload = {
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type PublicBanner = {
  id: number;
  title: string;
  imageUrl: string;
  imageAlt: string;
};

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

export type NewsPayload = {
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type PublicNews = Pick<
  News,
  "id" | "title" | "body" | "imageUrl" | "imageAlt" | "isPinned" | "publishedAt"
>;

export type PublicNewsPage = {
  items: PublicNews[];
  total: number;
  page: number;
  limit: number;
};

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

export type PublicGalleryImage = Pick<
  GalleryImage,
  "id" | "imageUrl" | "imageAlt" | "caption"
>;

export type ImageUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  maxBytes: number;
};

export type PublicContentCard = Pick<
  ContentCard,
  "id" | "title" | "subtitle" | "description" | "imageUrl" | "imageAlt"
>;

export type PublicContent = {
  mission: string | null;
  vision: string | null;
  values: PublicContentCard[];
  team: PublicContentCard[];
  services: PublicContentCard[];
  programs: PublicContentCard[];
};
