import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppointmentClinicalNotesPage from "@/features/consultants/pages/appointment-clinical-notes-page";
import { requireAnyRole } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Nota clínica | SANA" };

/**
 * Renders the clinical notes page for a specific appointment.
 * @param param0 - An object containing the route parameters.
 * @returns A React component that displays the appointment's clinical notes page.
 */
export default async function AppointmentClinicalNotes({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  await requireAnyRole(["psicologo"]);
  const { appId } = await params;
  const appointmentId = Number(appId);

  if (!Number.isInteger(appointmentId) || appointmentId < 1) {
    notFound();
  }

  return <AppointmentClinicalNotesPage appointmentId={appointmentId} />;
}
