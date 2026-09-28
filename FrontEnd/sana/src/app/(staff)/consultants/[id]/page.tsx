import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-guard";
import ConsultantsListPage from "@/features/consultants/pages/consultants-list-page";

export const metadata: Metadata = { title: "Consultantes | SANA" };

/**
 * Decide qué listado mostrar según el rol de quien pregunta (HU-2.4):
 * el psicólogo ve la lista completa de sus consultantes asignados, con
 * motivo de consulta incluido; la asistente y el administrador ven la
 * versión sin datos clínicos.
 */
export default async function Consultants() {
  const user = await getCurrentUser();
  const viewerRole = user.roles.includes("psicologo")
    ? "psychologist"
    : "assistant";

  return <ConsultantsListPage viewerRole={viewerRole} />;
}