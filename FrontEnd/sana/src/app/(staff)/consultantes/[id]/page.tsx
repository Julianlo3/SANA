import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConsultantFullRecordPage from "@/features/consultants/pages/consultant-full-record-page";
import { requireAnyRole } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Notas clínicas | SANA" };

/**
 * Renders the clinical notes page for a specific consultant.
 * @param param0 - An object containing the route parameters.
 * @returns A React component that displays the consultant's full record page.
 */
export default async function ConsultantClinicalNotes({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAnyRole(["psicologo"]);
  const { id } = await params;
  const consultantId = Number(id);

  if (!Number.isInteger(consultantId) || consultantId < 1) {
    notFound();
  }

  return <ConsultantFullRecordPage consultantId={consultantId} />;
}