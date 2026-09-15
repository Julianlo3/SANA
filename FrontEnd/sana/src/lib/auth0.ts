import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Cliente de Auth0. La sesión se guarda en una cookie cifrada del servidor,
 * así que el token nunca queda expuesto en el navegador.
 *
 * El audience es necesario para que Auth0 emita un access token válido para
 * la API de SANA, no solo un token de identidad.
 */
export const auth0 = new Auth0Client({
  authorizationParameters: {
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  },
});