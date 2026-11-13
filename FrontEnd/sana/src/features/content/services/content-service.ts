import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  ContentCard,
  ContentCardPayload,
  ContentCardSection,
  ContentItem,
  ContentItemKey,
} from "../types/content-types";

/**
 * Retrieves content items.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export function getContentItems(signal?: AbortSignal): Promise<ContentItem[]> {
  return httpClient.get<ContentItem[]>(ENDPOINTS.contentItems, signal);
}

/**
 * Saves content items.
 * @param items items input.
 * @returns A promise resolving to the operation result.
 */

export function saveContentItems(
  items: { key: ContentItemKey; value: string }[],
): Promise<ContentItem[]> {
  return httpClient.patch<ContentItem[]>(ENDPOINTS.contentItems, { items });
}

/**
 * Retrieves content cards.
 * @param section section input.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export function getContentCards(
  section: ContentCardSection,
  signal?: AbortSignal,
): Promise<ContentCard[]> {
  return httpClient.get<ContentCard[]>(
    `${ENDPOINTS.contentCards}?section=${section}`,
    signal,
  );
}

/**
 * Creates content card.
 * @param section section input.
 * @param payload Data submitted to the operation.
 * @returns A promise resolving to the operation result.
 */

export function createContentCard(
  section: ContentCardSection,
  payload: ContentCardPayload,
): Promise<ContentCard> {
  return httpClient.post<ContentCard>(ENDPOINTS.contentCards, {
    section,
    ...payload,
    subtitle: payload.subtitle ?? undefined,
    description: payload.description ?? undefined,
    imageUrl: payload.imageUrl ?? undefined,
    imageAlt: payload.imageAlt ?? undefined,
  });
}

/**
 * Updates update content card.
 * @param id id identifier.
 * @param payload Data sent to the operation.
 * @returns A promise resolving to the operation result.
 */
export function updateContentCard(
  id: number,
  payload: Partial<ContentCardPayload>,
): Promise<ContentCard> {
  return httpClient.patch<ContentCard>(ENDPOINTS.contentCard(id), payload);
}

/**
 * Deletes content card.
 * @param id Resource identifier.
 */

export function deleteContentCard(id: number): Promise<void> {
  return httpClient.remove<void>(ENDPOINTS.contentCard(id));
}
