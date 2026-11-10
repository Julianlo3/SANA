'use server';

import { auth0 } from "@/lib/auth0";
import { requireAdministrator } from "@/lib/auth-guard";

export async function testBackendAuthMe() {
  await requireAdministrator();

  const token = await auth0.getAccessToken().catch(() => null);

  if (!token?.token) {
    throw new Error("No hay un token de Auth0 disponible. ¿Iniciaste sesión?");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

  const response = await fetch(`${apiUrl}/auth/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token.token}`,
      "Content-Type": "application/json",
      "Origin": process.env.APP_BASE_URL || "http://localhost:5173"
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`El backend rechazó la petición: ${response.statusText} (${response.status})`);
  }

  return await response.json();
}
