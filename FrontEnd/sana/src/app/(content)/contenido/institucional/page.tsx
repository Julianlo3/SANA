import type { Metadata } from "next";
import InstitutionalContentPage from "@/features/content/pages/institutional-content-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Contenido institucional | SANA" };

/**
 * Renders the institutional content page.
 * @returns Rendered component.
 */
export default function InstitutionalContent() {
  return <InstitutionalContentPage />;
}
