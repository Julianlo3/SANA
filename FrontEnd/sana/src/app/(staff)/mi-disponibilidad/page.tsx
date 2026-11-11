import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import WeeklyAvailabilityPage from "@/features/schedule/pages/weekly-availability-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Mi disponibilidad | SANA" };

/**
 * Renders the my availability page.
 * @returns Rendered component.
 */
export default async function MyAvailability() {
  const user = await requireAnyRole(["psicologo"]);
  return <WeeklyAvailabilityPage psyTermsAccepted={user.psyTermsAccepted} />;
}