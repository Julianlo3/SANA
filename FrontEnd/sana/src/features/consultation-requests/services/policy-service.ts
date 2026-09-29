import { httpClient } from "@/services/api/http-client";

/** Los tres tipos que existen hoy en policy_documents (ver 02-inserts.sql). */
export type PolicyType = "data_treatment" | "dependent_consent" | "schedule_terms";

export type PolicyDocument = {
  pdId: number;
  pdType: string;
  pdVersion: string;
  pdContent: string;
  pdEffectiveFrom: string;
};

/**
 * Trae el texto vigente de una política (GET /policy/:type), público y sin
 * autenticación. Se usa para mostrar el texto real en los checkboxes de
 * autorización del formulario de solicitud (HU-2.2.6 y HU-2.2.8).
 */
export async function getPolicyDocument(
  type: PolicyType,
  signal?: AbortSignal,
): Promise<PolicyDocument> {
  return httpClient.get<PolicyDocument>(`/policy/${type}`, signal);
}