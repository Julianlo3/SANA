import type { PolicyDocument, PolicyType } from "@/features/consultation-requests/services/policy-service";

/**
 * Defines the backend url.
 */
const BACKEND_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:3000/api/v1";

/**
 * Defines the revalidate seconds.
 */
const REVALIDATE_SECONDS = 300;

/**
 * Server-side only. Fetches the current version of a public legal document.
 * Returns null when the backend is unreachable or has no document of that type.
 * @param type type input.
 * @returns A promise resolving to the operation result.
 */
export async function getPublicPolicyDocument(
  type: PolicyType,
): Promise<PolicyDocument | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/policy/${type}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    return (await response.json()) as PolicyDocument;
  } catch {
    return null;
  }
}
