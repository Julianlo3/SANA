import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guard";

/**
 * Post-login entry point that routes users to the first page allowed by their role.
 */
export default async function PanelHome() {
  const user = await getCurrentUser();

  if (user.roles.length === 0) redirect("/cuenta-pendiente");
  if (user.roles.includes("administrador")) redirect("/usuarios");
  if (user.roles.includes("psicologo") || user.roles.includes("secretario")) {
    redirect("/consultantes");
  }
  if (user.roles.includes("marketing")) redirect("/contenido/institucional");
  if (user.roles.includes("consultante")) redirect("/mi-cuenta");

  redirect("/acceso-restringido");
}