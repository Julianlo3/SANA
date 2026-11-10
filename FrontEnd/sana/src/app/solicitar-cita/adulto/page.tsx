import type { Metadata } from "next";
import SelfRequestPage from "@/features/consultation-requests/pages/self-request-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Solicitar cita | SANA" };

/**
 * Renders the self request page.
 * @returns Rendered component.
 */
export default function SelfRequest() {
  return <SelfRequestPage />;
}
