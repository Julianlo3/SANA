"use server";

import { updateTag } from "next/cache";
import { requireAnyRole } from "@/lib/auth-guard";
import {
  CONTENT_ROLES,
  PUBLIC_CONTENT_TAG,
  PUBLIC_TAGS,
  type PublicTag,
} from "../config/content-access";

/** Expires the cached public pages for the tag so the next visit shows the saved changes. */
export async function refreshPublicContent(
  tag: PublicTag = PUBLIC_CONTENT_TAG,
): Promise<void> {
  await requireAnyRole(CONTENT_ROLES);
  if (!PUBLIC_TAGS.includes(tag)) return;
  updateTag(tag);
}
