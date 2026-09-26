import { redirect } from "next/navigation";
import { auth0 } from "./auth0";

export type CurrentUser = {
  userId: number;
  personId: number;
  email: string;
  /** Viene de la sesión de Auth0 (session.user.name), no del backend. */
  fullName: string;
  roles: string[];
  auth0Subject: string;
  state: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

/**
 * Obtiene y valida el usuario actualmente autenticado.
 *
 * 1. Verifica que exista una sesión de Auth0.
 * 2. Obtiene el access token.
 * 3. Consulta al backend para obtener la información
 *    y los roles reales del usuario.
 * 4. Combina el nombre real (de Auth0) con los datos del backend.
 * 5. Redirige según el resultado de autorización.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/login");
  }

  const accessToken = await auth0.getAccessToken();

  if (!accessToken?.token) {
    redirect("/session-expired");
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      Origin:
        process.env.APP_BASE_URL ??
        "http://localhost:5173",
    },
    cache: "no-store",
  });

  /**
   * El backend indica que la sesión/token ya no es válida.
   */
  if (response.status === 401) {
    redirect("/session-expired");
  }

  /**
   * El usuario está autenticado, pero no tiene
   * autorización para acceder al recurso.
   */
  if (response.status === 403) {
    redirect("/restricted-access");
  }

  /**
   * Cualquier otro error inesperado.
   */
  if (!response.ok) {
    throw new Error(
      "No se pudo validar la autorización local.",
    );
  }

  const backendUser = (await response.json()) as Omit<CurrentUser, "fullName">;

  return {
    ...backendUser,
    fullName: session.user.name ?? backendUser.email,
  };
}

/**
 * Exige que el usuario tenga el rol de administrador.
 *
 * Si el usuario todavía no tiene roles asignados,
 * se envía a la pantalla de cuenta pendiente.
 */
export async function requireAdministrator(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (user.roles.length === 0) {
    redirect("/pending-account");
  }

  if (!user.roles.includes("administrador")) {
    redirect("/restricted-access");
  }

  return user;
}

/**
 * Exige que el usuario tenga al menos uno de los roles indicados.
 *
 * Ejemplo:
 *
 * requireAnyRole(["secretario", "psicologo"]);
 */
export async function requireAnyRole(
  allowedRoles: string[],
): Promise<CurrentUser> {
  const user = await getCurrentUser();

  /**
   * El usuario está autenticado, pero todavía
   * no tiene ningún rol asignado.
   */
  if (user.roles.length === 0) {
    redirect("/pending-account");
  }

  /**
   * Verifica si al menos uno de los roles del usuario
   * está incluido entre los roles permitidos.
   */
  const hasAllowedRole = user.roles.some((role) =>
    allowedRoles.includes(role),
  );

  if (!hasAllowedRole) {
    redirect("/restricted-access");
  }

  return user;
}