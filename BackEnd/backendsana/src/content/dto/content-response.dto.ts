import type {
  ContentCardSection,
  ContentItemKey,
} from '../content.constants.js';

/** Minimal editor identity attached to content changes. */
export interface ContentEditor {
  id: number;
  name: string;
}

/** Response for a singleton institutional content item. */
export interface ContentItemResponse {
  key: ContentItemKey;
  value: string | null;
  updatedAt: Date | null;
  updatedBy: ContentEditor | null;
}

/** Administrative response for an editable, ordered content card. */
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

/** Public-safe projection of a content card. */
export type PublicContentCard = Pick<
  ContentCardResponse,
  'id' | 'title' | 'subtitle' | 'description' | 'imageUrl' | 'imageAlt'
>;

/** Aggregated institutional content returned by the public endpoint. */
export interface PublicContentResponse {
  mission: string | null;
  vision: string | null;
  values: PublicContentCard[];
  team: PublicContentCard[];
  services: PublicContentCard[];
  programs: PublicContentCard[];
}
