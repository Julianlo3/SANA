import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type { GalleryImage, PublicationStatus } from "../types/content-types";

export function getGalleryImages(signal?: AbortSignal): Promise<GalleryImage[]> {
  return httpClient.get<GalleryImage[]>(ENDPOINTS.galleryImages, signal);
}

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

export function updateGalleryImage(
  id: number,
  payload: { imageAlt?: string; caption?: string | null },
): Promise<GalleryImage> {
  return httpClient.patch<GalleryImage>(ENDPOINTS.galleryImage(id), payload);
}

export function updateGalleryImageStatus(
  id: number,
  status: PublicationStatus,
): Promise<GalleryImage> {
  return httpClient.patch<GalleryImage>(ENDPOINTS.galleryImageStatus(id), {
    status,
  });
}
