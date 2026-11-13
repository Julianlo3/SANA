import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-guard";
import ConsultantsListPage from "@/features/consultants/pages/consultants-list-page";

/**
 * Defines page metadata.
 */
export const metadata: Metadata = { title: "Consultantes | SANA" };

/**
 * Renders the consultant list appropriate for the current role.
 * Psychologists see assigned consultants with consultation reasons; assistants
 * and administrators receive the summary without clinical data.
 */
export default async function Consultants() {
  const user = await getCurrentUser();
  const viewerRole = user.roles.includes("psicologo")
    ? "psychologist"
    : "assistant";

  return (
    <ConsultantsListPage
      viewerRole={viewerRole}
      canCreate={user.roles.includes("secretario")}
    />
  );
}