import { httpClient } from "@/services/api/http-client";

/**
 * PATCH /auth/terms records that the authenticated user accepted the version
 * vigente de account_terms, terms_of_use y privacy_policy.
 */
export async function acceptAccountTerms(): Promise<void> {
  await httpClient.patch<unknown>("/auth/terms", {});
}
