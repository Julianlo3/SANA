import type {
  ContentCardSection,
  ContentItemKey,
  TeamGroup,
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
  teamGroup: TeamGroup | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  photoCrop: PhotoCrop | null;
  updatedAt: Date;
  updatedBy: ContentEditor;
}

/** Circular photo crop as percentages of the original image size. */
export interface PhotoCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Public-safe projection of a content card. */
export type PublicContentCard = Pick<
  ContentCardResponse,
  'id' | 'title' | 'subtitle' | 'description' | 'imageUrl' | 'imageAlt'
>;

/** Public-safe projection of a team member card. */
export interface PublicTeamCard extends PublicContentCard {
  teamGroup: TeamGroup;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  photoCrop: PhotoCrop | null;
}

/** Aggregated institutional content returned by the public endpoint. */
export interface PublicContentResponse {
  mission: string | null;
  vision: string | null;
  values: PublicContentCard[];
  team: PublicTeamCard[];
  services: PublicContentCard[];
  programs: PublicContentCard[];
}
