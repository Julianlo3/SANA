import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import MyAppointmentsPage from "@/features/my-appointments/pages/my-appointments-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Mis citas | SANA" };

/**
 * Renders the my appointments page.
 * @returns Rendered component.
 */
export default async function MyAppointments() {
  await requireAnyRole(["psicologo"]);
  return <MyAppointmentsPage />;
}