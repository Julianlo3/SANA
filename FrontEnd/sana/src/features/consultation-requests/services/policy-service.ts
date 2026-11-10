import { httpClient } from "@/services/api/http-client";

/** Policy document types supported by the backend. */
export type PolicyType =
  | "data_treatment"
  | "dependent_consent"
  | "schedule_terms"
  | "privacy_policy"
  | "terms_of_use"
  | "account_terms"
  | "donation_terms";

/** Respuesta de GET /policy/:type. */
export type PolicyDocument = {
  id: number;
  type: PolicyType;
  version: string;
  content: string;
  effectiveFrom: string;
};

/**
 * Retrieves policy document.
 * @param type type input.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export async function getPolicyDocument(
  type: PolicyType,
  signal?: AbortSignal,
): Promise<PolicyDocument> {
  return httpClient.get<PolicyDocument>(`/policy/${type}`, signal);
}
