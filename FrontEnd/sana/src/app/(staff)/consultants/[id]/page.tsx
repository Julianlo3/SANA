import type { Metadata } from "next";
import ConsultantFullRecordPage from "@/features/consultants/pages/consultant-full-record-page";

export const metadata: Metadata = { title: "Ficha del consultante | SANA" };

export default async function ConsultantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConsultantFullRecordPage consultantId={Number(id)} />;
}