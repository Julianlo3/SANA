import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Monta las rutas de Auth0 (/auth/login, /auth/logout, /auth/callback)
 * y refresca la sesión en cada petición.
 */
export async function proxy(request: NextRequest) {
  return auth0.middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg)$).*)"],
};