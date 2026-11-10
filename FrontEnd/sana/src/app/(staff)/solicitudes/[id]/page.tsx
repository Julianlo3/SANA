import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAnyRole } from "@/lib/auth-guard";
import AppointmentDetailPage from "@/features/appointments/pages/appointment-detail-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Solicitud de cita | SANA" };

/**
 * Renders the appointment detail page.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default async function AppointmentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAnyRole(["secretario"]);

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId < 1) notFound();

  return <AppointmentDetailPage appointmentId={appointmentId} />;
}