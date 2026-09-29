import type { Metadata } from "next";
import InstitutionalContentPage from "@/features/content/pages/institutional-content-page";

export const metadata: Metadata = { title: "Contenido institucional | SANA" };

export default function InstitutionalContent() {
  return <InstitutionalContentPage />;
}
