import { httpClient } from "@/services/api/http-client";

/**
 * PATCH /auth/terms: registra que la persona autenticada aceptó la versión
 * vigente de account_terms, terms_of_use y privacy_policy.
 */
export async function acceptAccountTerms(): Promise<void> {
  await httpClient.patch<unknown>("/auth/terms", {});
}
