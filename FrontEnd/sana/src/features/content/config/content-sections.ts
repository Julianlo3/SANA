import type { ContentCardSection, TeamGroup } from "../types/content-types";

export type CardField = "title" | "subtitle" | "description";

export type CardFieldConfig = {
  label: string;
  required: boolean;
  hint?: string;
  placeholder?: string;
};

export type CardSectionConfig = {
  section: ContentCardSection;
  label: string;
  description: string;
  itemName: string;
  fields: Record<CardField, CardFieldConfig | null>;
  image: { label: string; required: boolean } | null;
  teamProfile: boolean;
};

export type SocialField = "facebookUrl" | "instagramUrl" | "linkedinUrl";

export const TEAM_GROUP_OPTIONS: { value: TeamGroup; label: string; hint: string }[] = [
  {
    value: "staff",
    label: "Equipo de trabajo",
    hint: "Dirección, administración, marketing, diseño…",
  },
  {
    value: "professional",
    label: "Equipo profesional",
    hint: "Psicólogas, psicólogos y demás profesionales.",
  },
];

export const TEAM_GROUP_LABELS: Record<TeamGroup, string> = {
  staff: "Equipo de trabajo",
  professional: "Equipo profesional",
};

export const SOCIAL_FIELDS: {
  field: SocialField;
  label: string;
  domain: string;
  placeholder: string;
  pattern: RegExp;
}[] = [
  {
    field: "facebookUrl",
    label: "Facebook",
    domain: "facebook.com",
    placeholder: "https://www.facebook.com/usuario",
    pattern: /^https:\/\/([a-z0-9-]+\.)*facebook\.com\/\S+$/i,
  },
  {
    field: "instagramUrl",
    label: "Instagram",
    domain: "instagram.com",
    placeholder: "https://www.instagram.com/usuario",
    pattern: /^https:\/\/([a-z0-9-]+\.)*instagram\.com\/\S+$/i,
  },
  {
    field: "linkedinUrl",
    label: "LinkedIn",
    domain: "linkedin.com",
    placeholder: "https://www.linkedin.com/in/usuario",
    pattern: /^https:\/\/([a-z0-9-]+\.)*linkedin\.com\/\S+$/i,
  },
];

export const SOCIAL_URL_MAX_LENGTH = 300;

export const CARD_SECTIONS: CardSectionConfig[] = [
  {
    section: "values",
    label: "Valores",
    description: "Los principios que guían el trabajo de la fundación.",
    itemName: "valor",
    fields: {
      title: { label: "Nombre del valor", required: true },
      subtitle: null,
      description: { label: "Descripción", required: false },
    },
    image: null,
    teamProfile: false,
  },
  {
    section: "team",
    label: "Equipo",
    description: "Las personas que forman parte de la fundación.",
    itemName: "integrante",
    fields: {
      title: { label: "Nombre", required: true },
      subtitle: { label: "Cargo", required: true },
      description: {
        label: "Descripción",
        required: false,
        hint: "Incluye el perfil profesional (formación, experiencia, enfoque) y una breve descripción de la persona.",
        placeholder:
          "Ej.: Psicóloga de la Universidad del Cauca con experiencia en acompañamiento a niñas, niños y adolescentes. Le apasiona…",
      },
    },
    image: { label: "Foto", required: true },
    teamProfile: true,
  },
  {
    section: "services",
    label: "Servicios",
    description: "Lo que la fundación ofrece a las familias.",
    itemName: "servicio",
    fields: {
      title: { label: "Nombre del servicio", required: true },
      subtitle: null,
      description: { label: "Descripción", required: true },
    },
    image: null,
    teamProfile: false,
  },
  {
    section: "programs",
    label: "Programas",
    description: "Los programas activos de la fundación.",
    itemName: "programa",
    fields: {
      title: { label: "Nombre del programa", required: true },
      subtitle: null,
      description: { label: "Descripción", required: true },
    },
    image: null,
    teamProfile: false,
  },
];

export const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_RULES_MESSAGE =
  "La imagen debe ser JPG, PNG o WebP de máximo 5 MB.";

export const NEWS_TITLE_MAX_LENGTH = 150;
export const NEWS_BODY_MAX_LENGTH = 10000;
export const IMAGE_ALT_MAX_LENGTH = 150;
export const GALLERY_CAPTION_MAX_LENGTH = 200;

export const TEXT_MAX_LENGTH = 2000;
export const CARD_DESCRIPTION_MAX_LENGTH = 1000;
export const CARD_TITLE_MAX_LENGTH = 150;
