import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type { Banner, BannerList, BannerPayload } from "../types/content-types";

export function getBanners(signal?: AbortSignal): Promise<BannerList> {
  return httpClient.get<BannerList>(ENDPOINTS.banners, signal);
}

export function createBanner(
  payload: BannerPayload & { isActive: boolean },
): Promise<Banner> {
  return httpClient.post<Banner>(ENDPOINTS.banners, {
    title: payload.title,
    imageUrl: payload.imageUrl ?? undefined,
    imageAlt: payload.imageAlt ?? undefined,
    startsAt: payload.startsAt ?? undefined,
    endsAt: payload.endsAt ?? undefined,
    isActive: payload.isActive,
  });
}

export function updateBanner(
  id: number,
  payload: Partial<BannerPayload>,
): Promise<Banner> {
  return httpClient.patch<Banner>(ENDPOINTS.banner(id), payload);
}

export function updateBannerActivation(
  id: number,
  isActive: boolean,
): Promise<Banner> {
  return httpClient.patch<Banner>(ENDPOINTS.bannerActivation(id), { isActive });
}

export function deleteBanner(id: number): Promise<void> {
  return httpClient.remove<void>(ENDPOINTS.banner(id));
}
