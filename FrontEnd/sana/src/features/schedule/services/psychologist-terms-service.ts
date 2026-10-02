import { httpClient } from "@/services/api/http-client";

/**
 * Términos generales de psicólogo (distintos de schedule_terms).
 * PATCH /auth/psychologist-terms, sin cuerpo — identifica al psicólogo
 * por el token de sesión.
 */
export async function acceptPsychologistTerms(): Promise<void> {
  await httpClient.patch<void>("/auth/psychologist-terms", {});
}