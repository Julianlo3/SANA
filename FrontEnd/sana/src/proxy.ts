import { auth0 } from "./lib/auth0";

/**
 * Proxies requests to the authentication middleware.
 * @param request The request to proxy.
 * @returns The response from the authentication middleware.
 */
export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

/**
 * Middleware function to handle authentication and authorization.
 * @param request The request to handle.
 * @returns The response.
 */
export default async function middleware(request: Request) {
  return await auth0.middleware(request);
}

/**
 * Configuration for the middleware.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
