import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type { GalleryImage, PublicationStatus } from "../types/content-types";

/**
 * Retrieves gallery images.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export function getGalleryImages(signal?: AbortSignal): Promise<GalleryImage[]> {
  return httpClient.get<GalleryImage[]>(ENDPOINTS.galleryImages, signal);
}

/**
 * Creates gallery image.
 * @param payload Data submitted to the operation.
 * @returns A promise resolving to the operation result.
 */

export function createGalleryImage(payload: {
  imageUrl: string;
  imageAlt: string;
  caption: string | null;
}): Promise<GalleryImage> {
  return httpClient.post<GalleryImage>(ENDPOINTS.galleryImages, {
    ...payload,
    caption: payload.caption ?? undefined,
  });
}

/**
 * Updates update gallery image.
 * @param id id identifier.
 * @param payload Data sent to the operation.
 * @returns A promise resolving to the operation result.
 */
export function updateGalleryImage(
  id: number,
  payload: { imageAlt?: string; caption?: string | null },
): Promise<GalleryImage> {
  return httpClient.patch<GalleryImage>(ENDPOINTS.galleryImage(id), payload);
}

/**
 * Updates update gallery image status.
 * @param id id identifier.
 * @param status Current status value.
 * @returns A promise resolving to the operation result.
 */
export function updateGalleryImageStatus(
  id: number,
  status: PublicationStatus,
): Promise<GalleryImage> {
  return httpClient.patch<GalleryImage>(ENDPOINTS.galleryImageStatus(id), {
    status,
  });
}

/**
 * Deletes gallery image.
 * @param id Resource identifier.
 */

export function deleteGalleryImage(id: number): Promise<void> {
  return httpClient.remove<void>(ENDPOINTS.galleryImage(id));
}
