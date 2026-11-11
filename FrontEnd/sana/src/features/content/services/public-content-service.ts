import { ENDPOINTS } from "@/services/api/endpoints";
import {
  PUBLIC_CONTENT_TAG,
  PUBLIC_GALLERY_TAG,
  PUBLIC_NEWS_TAG,
  type PublicTag,
} from "../config/content-access";
import type {
  PublicBanner,
  PublicContent,
  PublicGalleryImage,
  PublicNews,
  PublicNewsPage,
} from "../types/content-types";

/**
 * Defines the backend url.
 */
const BACKEND_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:3000/api/v1";

/**
 * Defines empty public content.
 */
export const EMPTY_PUBLIC_CONTENT: PublicContent = {
  mission: null,
  vision: null,
  values: [],
  team: [],
  services: [],
  programs: [],
};

/**
 * Server-side only. Returns null when the backend is unreachable or answers with an error.
 * @param path path input.
 * @param tag tag input.
 * @returns A promise resolving to the operation result.
 */
async function fetchPublic<T>(path: string, tag: PublicTag): Promise<T | null> {
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      cache: "force-cache",
      next: { tags: [tag], revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Retrieves public content.
 * @returns A promise resolving to the operation result.
 */

export async function getPublicContent(): Promise<PublicContent> {
  return (
    (await fetchPublic<PublicContent>(ENDPOINTS.publicContent, PUBLIC_CONTENT_TAG)) ??
    EMPTY_PUBLIC_CONTENT
  );
}

/**
 * Retrieves public news.
 * @param page Optional. Page number.
 * @param limit Optional. Maximum number of items.
 * @returns A promise resolving to the operation result.
 */

export async function getPublicNews(page = 1, limit = 9): Promise<PublicNewsPage> {
  return (
    (await fetchPublic<PublicNewsPage>(
      `${ENDPOINTS.publicNews}?page=${page}&limit=${limit}`,
      PUBLIC_NEWS_TAG,
    )) ?? { items: [], total: 0, page, limit }
  );
}

/**
 * Retrieves public news item.
 * @param id Resource identifier.
 * @returns A promise resolving to the operation result.
 */

export function getPublicNewsItem(id: number): Promise<PublicNews | null> {
  return fetchPublic<PublicNews>(ENDPOINTS.publicNewsItem(id), PUBLIC_NEWS_TAG);
}

/**
 * Not cached: banners depend on the current date, so an expired banner must disappear right away.
 * @returns A promise resolving to the operation result.
 */
export async function getPublicBanners(): Promise<PublicBanner[]> {
  try {
    const response = await fetch(`${BACKEND_URL}${ENDPOINTS.publicBanners}`, {
      cache: "no-store",
    });
    return response.ok ? ((await response.json()) as PublicBanner[]) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves public gallery.
 * @returns A promise resolving to the operation result.
 */

export async function getPublicGallery(): Promise<PublicGalleryImage[]> {
  return (
    (await fetchPublic<PublicGalleryImage[]>(
      ENDPOINTS.publicGalleryImages,
      PUBLIC_GALLERY_TAG,
    )) ?? []
  );
}
