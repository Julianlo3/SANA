import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import ReferralsInboxPage from "@/features/appointments/pages/referrals-inbox-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Valoraciones remitidas | SANA" };

/**
 * Renders the referred valuations inbox for the secretary.
 * @returns Rendered component.
 */
export default async function ReferralsInbox() {
  await requireAnyRole(["secretario"]);
  return <ReferralsInboxPage />;
}
