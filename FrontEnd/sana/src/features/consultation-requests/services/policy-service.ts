import { httpClient } from "@/services/api/http-client";

/** Tipos de documento que existen en policy_documents. */
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
 * Trae el texto vigente de una política (GET /policy/:type), público y sin
 * autenticación. Se usa en las casillas de autorización y en los términos
 * de agenda del psicólogo.
 */
export async function getPolicyDocument(
  type: PolicyType,
  signal?: AbortSignal,
): Promise<PolicyDocument> {
  return httpClient.get<PolicyDocument>(`/policy/${type}`, signal);
}
