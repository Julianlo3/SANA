import type { Metadata } from "next";
import ConsultantSummaryPage from "@/features/consultants/pages/consultant-summary-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Ficha del consultante | SANA" };

/**
 * Renders the consultant summary page.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default async function ConsultantSummary({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConsultantSummaryPage consultantId={Number(id)} />;
}