import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import ConsultantCreatePage from "@/features/consultants/pages/consultant-create-page";

export const metadata: Metadata = { title: "Registrar consultante | SANA" };

export default async function NewConsultant() {
  await requireAnyRole(["secretario"]);
  return <ConsultantCreatePage />;
}
