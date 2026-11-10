import { LEGAL_LINKS } from "@/content/legal";

/**
 * Links each consent control to its current policy document.
 * Consent text and version come from `policy_documents`; the full document is
 * published at `/politica-de-datos`.
 */
export const DATA_POLICY = {
  url: LEGAL_LINKS.privacyPolicy.href,
  linkLabel: LEGAL_LINKS.privacyPolicy.label,
  loadingLabel: "Cargando el texto de la autorización…",
  unavailableLabel:
    "No pudimos cargar el texto de la autorización. Recarga la página para continuar.",
} as const;
