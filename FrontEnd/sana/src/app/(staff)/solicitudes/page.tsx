import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import AppointmentsInboxPage from "@/features/appointments/pages/appointments-inbox-page";

export const metadata: Metadata = { title: "Solicitudes de cita | SANA" };

export default async function AppointmentsInbox() {
  await requireAnyRole(["secretario"]);
  return <AppointmentsInboxPage />;
}