import type {
  ContentCardSection,
  ContentItemKey,
} from '../content.constants.js';

export interface ContentEditor {
  id: number;
  name: string;
}

export interface ContentItemResponse {
  key: ContentItemKey;
  value: string | null;
  updatedAt: Date | null;
  updatedBy: ContentEditor | null;
}

export interface ContentCardResponse {
  id: number;
  section: ContentCardSection;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  order: number;
  isActive: boolean;
  updatedAt: Date;
  updatedBy: ContentEditor;
}

export type PublicContentCard = Pick<
  ContentCardResponse,
  'id' | 'title' | 'subtitle' | 'description' | 'imageUrl' | 'imageAlt'
>;

export interface PublicContentResponse {
  mission: string | null;
  vision: string | null;
  values: PublicContentCard[];
  team: PublicContentCard[];
  services: PublicContentCard[];
  programs: PublicContentCard[];
}
