import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import WeeklyAvailabilityPage from "@/features/schedule/pages/weekly-availability-page";

export const metadata: Metadata = { title: "Mi disponibilidad | SANA" };

export default async function MyAvailability() {
  const user = await requireAnyRole(["psicologo"]);
  return <WeeklyAvailabilityPage psychologistId={user.userId} />;
}