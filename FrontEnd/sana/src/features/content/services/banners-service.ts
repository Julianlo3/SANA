import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type { Banner, BannerList, BannerPayload } from "../types/content-types";

/**
 * Retrieves banners.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export function getBanners(signal?: AbortSignal): Promise<BannerList> {
  return httpClient.get<BannerList>(ENDPOINTS.banners, signal);
}

/**
 * Creates banner.
 * @param payload Data submitted to the operation.
 * @returns A promise resolving to the operation result.
 */

export function createBanner(
  payload: BannerPayload & { isActive: boolean },
): Promise<Banner> {
  return httpClient.post<Banner>(ENDPOINTS.banners, {
    title: payload.title,
    imageUrl: payload.imageUrl ?? undefined,
    imageAlt: payload.imageAlt ?? undefined,
    isActive: payload.isActive,
  });
}

/**
 * Updates update banner.
 * @param id id identifier.
 * @param payload Data sent to the operation.
 * @returns A promise resolving to the operation result.
 */
export function updateBanner(
  id: number,
  payload: Partial<BannerPayload>,
): Promise<Banner> {
  return httpClient.patch<Banner>(ENDPOINTS.banner(id), payload);
}

/**
 * Updates update banner activation.
 * @param id id identifier.
 * @param isActive is active input.
 * @returns A promise resolving to the operation result.
 */
export function updateBannerActivation(
  id: number,
  isActive: boolean,
): Promise<Banner> {
  return httpClient.patch<Banner>(ENDPOINTS.bannerActivation(id), { isActive });
}

/**
 * Deletes banner.
 * @param id Resource identifier.
 */

export function deleteBanner(id: number): Promise<void> {
  return httpClient.remove<void>(ENDPOINTS.banner(id));
}
