import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import PsychologistCalendarPage from "@/features/schedule/pages/psychologist-calendar-page";

export const metadata: Metadata = { title: "Calendario | SANA" };

export default async function CalendarPage() {
  await requireAnyRole(["secretario"]);
  return <PsychologistCalendarPage />;
}