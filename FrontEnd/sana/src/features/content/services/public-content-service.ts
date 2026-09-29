import { ENDPOINTS } from "@/services/api/endpoints";
import { PUBLIC_CONTENT_TAG } from "../config/content-access";
import type { PublicContent } from "../types/content-types";

const BACKEND_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:3000/api/v1";

export const EMPTY_PUBLIC_CONTENT: PublicContent = {
  mission: null,
  vision: null,
  values: [],
  team: [],
  services: [],
  programs: [],
};

/** Server-side only. Falls back to empty content so the home page still renders. */
export async function getPublicContent(): Promise<PublicContent> {
  try {
    const response = await fetch(`${BACKEND_URL}${ENDPOINTS.publicContent}`, {
      cache: "force-cache",
      next: { tags: [PUBLIC_CONTENT_TAG], revalidate: 300 },
    });
    if (!response.ok) return EMPTY_PUBLIC_CONTENT;
    return (await response.json()) as PublicContent;
  } catch {
    return EMPTY_PUBLIC_CONTENT;
  }
}
