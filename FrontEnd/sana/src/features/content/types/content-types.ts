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
