import type { CardField, CardSectionConfig } from "../config/content-sections";

export type MissionVisionValues = {
  mission: string;
  vision: string;
};

export type CardFormValues = Record<CardField, string> & {
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
};

export function validateMissionVision(
  values: MissionVisionValues,
): Partial<Record<keyof MissionVisionValues, string>> {
  const errors: Partial<Record<keyof MissionVisionValues, string>> = {};

  if (!values.mission.trim()) errors.mission = "Escribe la misión.";
  if (!values.vision.trim()) errors.vision = "Escribe la visión.";

  return errors;
}

export function buildCardValidator(config: CardSectionConfig) {
  return (values: CardFormValues): Partial<Record<keyof CardFormValues, string>> => {
    const errors: Partial<Record<keyof CardFormValues, string>> = {};

    for (const field of Object.keys(config.fields) as CardField[]) {
      const fieldConfig = config.fields[field];
      if (fieldConfig?.required && !values[field].trim()) {
        errors[field] = `${fieldConfig.label} es obligatorio.`;
      }
    }

    if (config.image?.required && !values.imageUrl) {
      errors.imageUrl = `${config.image.label} es obligatoria.`;
    }
    if (values.imageUrl && !values.imageAlt.trim()) {
      errors.imageAlt = "Describe la imagen.";
    }

    return errors;
  };
}
