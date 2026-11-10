import { httpClient } from "@/services/api/http-client";

/**
 * Accepts the general psychologist terms, separately from schedule terms.
 * The session token identifies the psychologist; the request has no body.
 */
export async function acceptPsychologistTerms(): Promise<void> {
  await httpClient.patch<void>("/auth/psychologist-terms", {});
}