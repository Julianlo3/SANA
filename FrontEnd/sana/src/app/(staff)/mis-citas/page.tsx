import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import MyAppointmentsPage from "@/features/my-appointments/pages/my-appointments-page";

export const metadata: Metadata = { title: "Mis citas | SANA" };

export default async function MyAppointments() {
  await requireAnyRole(["psicologo"]);
  return <MyAppointmentsPage />;
}