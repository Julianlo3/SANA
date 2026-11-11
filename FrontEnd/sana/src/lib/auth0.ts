import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Defines auth0.
 */
export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
  },
});