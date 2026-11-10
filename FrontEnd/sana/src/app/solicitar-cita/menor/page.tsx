import type { Metadata } from "next";
import GuardianRequestPage from "@/features/consultation-requests/pages/guardian-request-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Solicitar cita para un menor | SANA" };

/**
 * Renders the guardian request page.
 * @returns Rendered component.
 */
export default function GuardianRequest() {
  return <GuardianRequestPage />;
}