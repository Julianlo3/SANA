import type { ContentCardSection } from "../types/content-types";

export type CardField = "title" | "subtitle" | "description";

export type CardSectionConfig = {
  section: ContentCardSection;
  label: string;
  description: string;
  itemName: string;
  fields: Record<CardField, { label: string; required: boolean } | null>;
};

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
  },
  {
    section: "team",
    label: "Equipo",
    description: "Las personas que forman parte de la fundación.",
    itemName: "integrante",
    fields: {
      title: { label: "Nombre", required: true },
      subtitle: { label: "Cargo", required: true },
      description: { label: "Descripción", required: false },
    },
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
  },
];

export const TEXT_MAX_LENGTH = 2000;
export const CARD_DESCRIPTION_MAX_LENGTH = 1000;
export const CARD_TITLE_MAX_LENGTH = 150;
