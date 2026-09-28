import type { Metadata } from "next";
import { Suspense } from "react";
import RequestConfirmationPage from "@/features/consultation-requests/pages/request-confirmation-page";

export const metadata: Metadata = { title: "Solicitud enviada | SANA" };

export default function RequestConfirmation() {
  return (
    <Suspense>
      <RequestConfirmationPage />
    </Suspense>
  );
}