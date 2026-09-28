import type { Metadata } from "next";
import RequestTypePage from "@/features/consultation-requests/pages/request-type-page";

export const metadata: Metadata = { title: "Solicitar cita | SANA" };

export default function RequestType() {
  return <RequestTypePage />;
}