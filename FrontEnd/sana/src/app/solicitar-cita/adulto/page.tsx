import type { Metadata } from "next";
import SelfRequestPage from "@/features/consultation-requests/pages/self-request-page";

export const metadata: Metadata = { title: "Solicitar cita | SANA" };

export default function SelfRequest() {
  return <SelfRequestPage />;
}
