import { LEGAL_LINKS } from "@/content/legal";

/**
 * Enlace a la Política de Tratamiento de Datos Personales que acompaña cada
 * casilla de autorización. El texto de cada casilla y su versión vienen de
 * policy_documents (GET /policy/:type); el documento completo se publica en
 * /politica-de-datos.
 */
export const DATA_POLICY = {
  url: LEGAL_LINKS.privacyPolicy.href,
  linkLabel: LEGAL_LINKS.privacyPolicy.label,
  loadingLabel: "Cargando el texto de la autorización…",
  unavailableLabel:
    "No pudimos cargar el texto de la autorización. Recarga la página para continuar.",
} as const;
