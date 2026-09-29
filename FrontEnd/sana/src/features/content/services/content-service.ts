import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  ContentCard,
  ContentCardPayload,
  ContentCardSection,
  ContentItem,
  ContentItemKey,
} from "../types/content-types";

export function getContentItems(signal?: AbortSignal): Promise<ContentItem[]> {
  return httpClient.get<ContentItem[]>(ENDPOINTS.contentItems, signal);
}

export function saveContentItems(
  items: { key: ContentItemKey; value: string }[],
): Promise<ContentItem[]> {
  return httpClient.patch<ContentItem[]>(ENDPOINTS.contentItems, { items });
}

export function getContentCards(
  section: ContentCardSection,
  signal?: AbortSignal,
): Promise<ContentCard[]> {
  return httpClient.get<ContentCard[]>(
    `${ENDPOINTS.contentCards}?section=${section}`,
    signal,
  );
}

export function createContentCard(
  section: ContentCardSection,
  payload: ContentCardPayload,
): Promise<ContentCard> {
  return httpClient.post<ContentCard>(ENDPOINTS.contentCards, {
    section,
    ...payload,
    subtitle: payload.subtitle ?? undefined,
    description: payload.description ?? undefined,
  });
}

export function updateContentCard(
  id: number,
  payload: Partial<ContentCardPayload>,
): Promise<ContentCard> {
  return httpClient.patch<ContentCard>(ENDPOINTS.contentCard(id), payload);
}

export function deleteContentCard(id: number): Promise<void> {
  return httpClient.remove<void>(ENDPOINTS.contentCard(id));
}
