import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  News,
  NewsPayload,
  PublicationStatus,
} from "../types/content-types";

export function getNews(signal?: AbortSignal): Promise<News[]> {
  return httpClient.get<News[]>(ENDPOINTS.news, signal);
}

export function createNews(payload: NewsPayload): Promise<News> {
  return httpClient.post<News>(ENDPOINTS.news, {
    title: payload.title,
    body: payload.body,
    imageUrl: payload.imageUrl ?? undefined,
    imageAlt: payload.imageAlt ?? undefined,
  });
}

export function updateNews(
  id: number,
  payload: Partial<NewsPayload>,
): Promise<News> {
  return httpClient.patch<News>(ENDPOINTS.newsItem(id), payload);
}

export function updateNewsStatus(
  id: number,
  status: PublicationStatus,
): Promise<News> {
  return httpClient.patch<News>(ENDPOINTS.newsStatus(id), { status });
}

export function updateNewsPin(id: number, isPinned: boolean): Promise<News> {
  return httpClient.patch<News>(ENDPOINTS.newsPin(id), { isPinned });
}
