import type { Metadata } from "next";
import ConsultantSummaryPage from "@/features/consultants/pages/consultant-summary-page";

export const metadata: Metadata = { title: "Ficha del consultante | SANA" };

export default async function ConsultantSummary({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConsultantSummaryPage consultantId={Number(id)} />;
}