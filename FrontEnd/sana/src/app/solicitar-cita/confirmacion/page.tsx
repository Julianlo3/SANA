import type { Metadata } from "next";
import { Suspense } from "react";
import RequestConfirmationPage from "@/features/consultation-requests/pages/request-confirmation-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Solicitud enviada | SANA" };

/**
 * Renders the request confirmation page.
 * @returns Rendered component.
 */
export default function RequestConfirmation() {
  return (
    <Suspense>
      <RequestConfirmationPage />
    </Suspense>
  );
}