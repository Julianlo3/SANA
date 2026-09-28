import type { Metadata } from "next";
import GuardianRequestPage from "@/features/consultation-requests/pages/guardian-request-page";

export const metadata: Metadata = { title: "Solicitar cita para un menor | SANA" };

export default function GuardianRequest() {
  return <GuardianRequestPage />;
}