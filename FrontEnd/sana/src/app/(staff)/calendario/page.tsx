import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import PsychologistCalendarPage from "@/features/schedule/pages/psychologist-calendar-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Calendario | SANA" };

/**
 * Renders the calendar page.
 * @returns Rendered component.
 */
export default async function CalendarPage() {
  await requireAnyRole(["secretario"]);
  return <PsychologistCalendarPage />;
}