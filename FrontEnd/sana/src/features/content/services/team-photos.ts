import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type { PhotoCrop, PublicContent } from "../types/content-types";

/**
 * Photo of a "Nuestro equipo" member, with its saved crop.
 */
export type TeamPhoto = {
  src: string;
  crop: PhotoCrop | null;
};

/**
 * Normalizes a person's name for matching: no accents, lowercase, trimmed, single spaces.
 * @param name Name to normalize.
 * @returns Normalized name.
 */
export function normalizePersonName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Indexes team photos by normalized name. Names shared by more than one member map to null.
 * @param team Public team members.
 * @returns Photo per normalized name.
 */
export function buildTeamPhotoIndex(
  team: PublicContent["team"],
): Map<string, TeamPhoto | null> {
  const index = new Map<string, TeamPhoto | null>();

  for (const member of team) {
    const key = normalizePersonName(member.title);
    if (!key) continue;

    const photo = member.imageUrl
      ? { src: member.imageUrl, crop: member.photoCrop }
      : null;
    index.set(key, index.has(key) ? null : photo);
  }

  return index;
}

/**
 * Shared request so every avatar on the page reuses a single call to the public team endpoint.
 */
let teamPhotoIndex: Promise<Map<string, TeamPhoto | null>> | null = null;

/**
 * Loads the team photo index once per page load; failures resolve to an empty index.
 * @returns Photo per normalized name.
 */
export function loadTeamPhotoIndex(): Promise<Map<string, TeamPhoto | null>> {
  teamPhotoIndex ??= httpClient
    .get<PublicContent>(ENDPOINTS.publicContent)
    .then((content) => buildTeamPhotoIndex(content.team ?? []))
    .catch(() => new Map());
  return teamPhotoIndex;
}
