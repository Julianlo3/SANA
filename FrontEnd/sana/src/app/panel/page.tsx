import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guard";

/**
 * Punto de entrada después de iniciar sesión.
 * Envía a cada persona a la primera pantalla que su rol sí puede abrir.
 */
export default async function PanelHome() {
  const user = await getCurrentUser();

  if (user.roles.length === 0) redirect("/pending-account");
  if (user.roles.includes("administrador")) redirect("/users");
  if (user.roles.includes("psicologo") || user.roles.includes("secretario")) {
    redirect("/consultants");
  }

  redirect("/restricted-access");
}