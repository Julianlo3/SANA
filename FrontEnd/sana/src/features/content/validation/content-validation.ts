import {
  CARD_DESCRIPTION_MAX_LENGTH,
  CARD_TITLE_MAX_LENGTH,
  IMAGE_ALT_MAX_LENGTH,
  SOCIAL_FIELDS,
  SOCIAL_URL_MAX_LENGTH,
  TEXT_MAX_LENGTH,
  type CardField,
  type CardSectionConfig,
  type SocialField,
} from "../config/content-sections";
import type { PhotoCrop, TeamGroup } from "../types/content-types";

export type MissionVisionValues = {
  mission: string;
  vision: string;
};

export type CardFormValues = Record<CardField, string> &
  Record<SocialField, string> & {
    imageUrl: string;
    imageAlt: string;
    isActive: boolean;
    teamGroup: TeamGroup | "";
    photoCrop: PhotoCrop | null;
  };

/**
 * Validates an optional social profile URL against the domain of its network.
 * @param value The URL typed by the editor.
 * @param field The social network field being validated.
 * @returns The error message, or undefined when the URL is empty or valid.
 */
export function validateSocialUrl(value: string, field: SocialField): string | undefined {
  const url = value.trim();
  if (!url) return undefined;
  const social = SOCIAL_FIELDS.find((item) => item.field === field);
  if (!social) return undefined;
  if (url.length > SOCIAL_URL_MAX_LENGTH) return `Máximo ${SOCIAL_URL_MAX_LENGTH} caracteres.`;
  if (!social.pattern.test(url)) {
    return `Pega el enlace completo del perfil de ${social.label} (https://…${social.domain}/…).`;
  }
  return undefined;
}

const HTML_TAG_PATTERN = /[<>]/;
const SAFE_IMAGE_URL_PATTERN = /^https:\/\/[^\s"'<>]+$/i;

const CARD_FIELD_MAX_LENGTH: Record<CardField, number> = {
  title: CARD_TITLE_MAX_LENGTH,
  subtitle: CARD_TITLE_MAX_LENGTH,
  description: CARD_DESCRIPTION_MAX_LENGTH,
};

function validateText(value: string, maxLength: number): string | undefined {
  if (value.length > maxLength) return `Máximo ${maxLength} caracteres.`;
  if (HTML_TAG_PATTERN.test(value)) return "Contiene caracteres no permitidos (< o >).";
  return undefined;
}

export function validateMissionVision(
  values: MissionVisionValues,
): Partial<Record<keyof MissionVisionValues, string>> {
  const errors: Partial<Record<keyof MissionVisionValues, string>> = {};

  errors.mission = values.mission.trim()
    ? validateText(values.mission, TEXT_MAX_LENGTH)
    : "Escribe la misión.";
  errors.vision = values.vision.trim()
    ? validateText(values.vision, TEXT_MAX_LENGTH)
    : "Escribe la visión.";

  if (!errors.mission) delete errors.mission;
  if (!errors.vision) delete errors.vision;
  return errors;
}

export function buildCardValidator(config: CardSectionConfig) {
  return (values: CardFormValues): Partial<Record<keyof CardFormValues, string>> => {
    const errors: Partial<Record<keyof CardFormValues, string>> = {};

    for (const field of Object.keys(config.fields) as CardField[]) {
      const fieldConfig = config.fields[field];
      const value = values[field] ?? "";
      if (fieldConfig?.required && !value.trim()) {
        errors[field] = `${fieldConfig.label} es obligatorio.`;
        continue;
      }
      const textError = validateText(value, CARD_FIELD_MAX_LENGTH[field]);
      if (textError) errors[field] = textError;
    }

    if (config.image?.required && !values.imageUrl) {
      errors.imageUrl = `${config.image.label} es obligatoria.`;
    } else if (values.imageUrl && !SAFE_IMAGE_URL_PATTERN.test(values.imageUrl)) {
      errors.imageUrl = "La imagen no es válida. Vuelve a subirla.";
    }

    if (values.imageUrl && !values.imageAlt.trim()) {
      errors.imageAlt = "Describe la imagen.";
    } else if (values.imageAlt.length > IMAGE_ALT_MAX_LENGTH) {
      errors.imageAlt = `Máximo ${IMAGE_ALT_MAX_LENGTH} caracteres.`;
    } else if (HTML_TAG_PATTERN.test(values.imageAlt)) {
      errors.imageAlt = "Contiene caracteres no permitidos (< o >).";
    }

    if (config.teamProfile) {
      if (!values.teamGroup) errors.teamGroup = "Elige el grupo al que pertenece.";
      for (const { field } of SOCIAL_FIELDS) {
        const socialError = validateSocialUrl(values[field], field);
        if (socialError) errors[field] = socialError;
      }
    }

    return errors;
  };
}
