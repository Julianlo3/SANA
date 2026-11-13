import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  News,
  NewsPayload,
  PublicationStatus,
} from "../types/content-types";

/**
 * Retrieves news.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export function getNews(signal?: AbortSignal): Promise<News[]> {
  return httpClient.get<News[]>(ENDPOINTS.news, signal);
}

/**
 * Creates news.
 * @param payload Data submitted to the operation.
 * @returns A promise resolving to the operation result.
 */

export function createNews(payload: NewsPayload): Promise<News> {
  return httpClient.post<News>(ENDPOINTS.news, {
    title: payload.title,
    body: payload.body,
    imageUrl: payload.imageUrl ?? undefined,
    imageAlt: payload.imageAlt ?? undefined,
  });
}

/**
 * Updates update news.
 * @param id id identifier.
 * @param payload Data sent to the operation.
 * @returns A promise resolving to the operation result.
 */
export function updateNews(
  id: number,
  payload: Partial<NewsPayload>,
): Promise<News> {
  return httpClient.patch<News>(ENDPOINTS.newsItem(id), payload);
}

/**
 * Updates update news status.
 * @param id id identifier.
 * @param status Current status value.
 * @returns A promise resolving to the operation result.
 */
export function updateNewsStatus(
  id: number,
  status: PublicationStatus,
): Promise<News> {
  return httpClient.patch<News>(ENDPOINTS.newsStatus(id), { status });
}

/**
 * Updates update news pin.
 * @param id id identifier.
 * @param isPinned is pinned input.
 * @returns A promise resolving to the operation result.
 */
export function updateNewsPin(id: number, isPinned: boolean): Promise<News> {
  return httpClient.patch<News>(ENDPOINTS.newsPin(id), { isPinned });
}

/**
 * Deletes news.
 * @param id Resource identifier.
 */

export function deleteNews(id: number): Promise<void> {
  return httpClient.remove<void>(ENDPOINTS.newsItem(id));
}
