"use server";

import { updateTag } from "next/cache";
import { requireAnyRole } from "@/lib/auth-guard";
import { CONTENT_ROLES, PUBLIC_CONTENT_TAG } from "../config/content-access";

/** Expires the cached public content so the next visit shows the saved changes. */
export async function refreshPublicContent(): Promise<void> {
  await requireAnyRole(CONTENT_ROLES);
  updateTag(PUBLIC_CONTENT_TAG);
}
