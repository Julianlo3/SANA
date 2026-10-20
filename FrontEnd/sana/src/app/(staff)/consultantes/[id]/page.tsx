import type { Metadata } from "next";
import ConsultantFullRecordPage from "@/features/consultants/pages/consultant-full-record-page";

export const metadata: Metadata = { title: "Ficha del consultante | SANA" };

/**
 * Displays the full record of a consultant for the authenticated psychologist.
 * @param params The parameters for the page.
 * @returns The consultant full record page.
 */
export default async function ConsultantFullRecord({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const consultantId = Number(id);

  if (!Number.isInteger(consultantId) || consultantId <= 0) {
    return (
      <p className="mx-auto max-w-3xl text-sm text-text-subtle">
        No encontramos este consultante.
      </p>
    );
  }

  return <ConsultantFullRecordPage consultantId={consultantId} />;
}