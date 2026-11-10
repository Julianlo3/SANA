import type { Metadata } from "next";
import RequestTypePage from "@/features/consultation-requests/pages/request-type-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Solicitar cita | SANA" };

/**
 * Renders the request type page.
 * @returns Rendered component.
 */
export default function RequestType() {
  return <RequestTypePage />;
}