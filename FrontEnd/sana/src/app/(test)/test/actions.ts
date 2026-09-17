'use server';

import { auth0 } from "../../../lib/auth0";

export async function testBackendAuthMe() {
  // 1. Obtenemos el token desde el servidor de Next.js
  const token = await auth0.getAccessToken();

  if (!token) {
    throw new Error("No hay un token de Auth0 disponible. ¿Iniciaste sesión?");
  }

  // 2. Armamos la URL usando nuestra variable de entorno (hacia NestJS)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  
  // 3. Hacemos el fetch enviando el token en los headers
  const response = await fetch(`${apiUrl}/auth/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token.token}`,
      "Content-Type": "application/json",
      "Origin": process.env.APP_BASE_URL || "http://localhost:5173"
    }
  });

  if (!response.ok) {
    throw new Error(`El backend rechazó la petición: ${response.statusText} (${response.status})`);
  }

  // 4. Retornamos los datos que nos devuelve tu backend (NestJS)
  return await response.json();
}
