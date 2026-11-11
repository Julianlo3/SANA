import { redirect } from "next/navigation";
import { auth0 } from "./auth0";

/**
 * Represents the current authenticated user.
 */
export type CurrentUser = {
  userId: number;
  personId: number;
  email: string;
  /** Name from the Auth0 session, not the backend response. */
  fullName: string;
  roles: string[];
  auth0Subject: string;
  state: string;
  /** Null for non-psychologists; otherwise indicates terms acceptance. */
  psyTermsAccepted: boolean | null;
  /** Whether the current account, terms-of-use, and privacy policies were accepted. */
  termsAccepted: boolean;
};

/**
 * Defines the api url.
 */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

/**
 * Gets the current authenticated user from the backend.
 * If the backend is unreachable or returns an error, the user is redirected to a friendly status page.
 * @throws Will throw an error if the backend cannot be reached or returns an error.
 * @returns A promise that resolves to the current authenticated user.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/iniciar-sesion");
  }

  const accessToken = await auth0.getAccessToken().catch(() => null);

  if (!accessToken?.token) {
    redirect("/sesion-expirada");
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      Origin:
        process.env.APP_BASE_URL ??
        "http://localhost:5173",
    },
    cache: "no-store",
  }).catch((error: unknown) => {
    console.error("No se pudo conectar con el backend para validar la sesión.", error);
    redirect("/servicio-no-disponible");
  });

  /**
   * The backend reports an invalid session or access token.
   */
  if (response.status === 401) {
    redirect("/sesion-expirada");
  }

  /**
   * The authenticated user is not authorized to access this resource.
   */
  if (response.status === 403) {
    redirect("/acceso-restringido");
  }

  /**
   * Cualquier otro error inesperado.
   */
  if (!response.ok) {
    console.error(
      `El backend no pudo validar la sesión (HTTP ${response.status}).`,
    );
    redirect("/servicio-no-disponible");
  }

  const backendUser = (await response.json()) as Omit<CurrentUser, "fullName">;

  return {
    ...backendUser,
    fullName: session.user.name ?? backendUser.email,
  };
}

/**
 * Requires the user to have the administrator role.
 * Users without assigned roles are redirected to the pending-account page.
 * @returns A promise resolving to the operation result.
 */
export async function requireAdministrator(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (user.roles.length === 0) {
    redirect("/cuenta-pendiente");
  }

  if (!user.roles.includes("administrador")) {
    redirect("/acceso-restringido");
  }

  return user;
}

/**
 * Requires the user to have at least one of the specified roles.
 *
 * Ejemplo:
 *
 * requireAnyRole(["secretario", "psicologo"]);
 * @param allowedRoles Role values used by the operation.
 * @returns A promise resolving to the operation result.
 */
export async function requireAnyRole(
  allowedRoles: string[],
): Promise<CurrentUser> {
  const user = await getCurrentUser();

  /**
   * The authenticated user does not have any assigned roles yet.
   */
  if (user.roles.length === 0) {
    redirect("/cuenta-pendiente");
  }

  /**
   * Checks whether the user has at least one allowed role.
   */
  const hasAllowedRole = user.roles.some((role) =>
    allowedRoles.includes(role),
  );

  if (!hasAllowedRole) {
    redirect("/acceso-restringido");
  }

  return user;
}