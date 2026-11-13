import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import ConsultantCreatePage from "@/features/consultants/pages/consultant-create-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Registrar consultante | SANA" };

/**
 * Renders the new consultant page.
 * @returns Rendered component.
 */
export default async function NewConsultant() {
  await requireAnyRole(["secretario"]);
  return <ConsultantCreatePage />;
}
