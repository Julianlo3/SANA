import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import AppointmentsInboxPage from "@/features/appointments/pages/appointments-inbox-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Solicitudes de cita | SANA" };

/**
 * Renders the appointments inbox page.
 * @returns Rendered component.
 */
export default async function AppointmentsInbox() {
  await requireAnyRole(["secretario"]);
  return <AppointmentsInboxPage />;
}