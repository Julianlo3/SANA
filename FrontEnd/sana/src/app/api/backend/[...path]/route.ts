import { auth0 } from "@/lib/auth0";

/**
 * Defines the backend url.
 */
const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000/api/v1";

/**
 * Client IP as reported by the hosting edge. Vercel overwrites both headers,
 * so the browser cannot spoof them. The backend reads it through
 * X-Forwarded-For when TRUST_PROXY_HOPS is configured.
 * @param request HTTP request to process.
 * @returns Result of the operation.
 */
function clientIp(request: Request): string | undefined {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}

/**
 * Proxies requests to the backend with the session token when available.
 * Public endpoints can be forwarded without a session; backend guards remain
 * responsible for enforcing authentication and authorization.
 *
 * `auth0.getAccessToken()` throws `AccessTokenError` when no session exists.
 * @param request HTTP request to process.
 * @param context Route execution context.
 */
async function forward(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;

  let token: string | undefined;
  try {
    const accessToken = await auth0.getAccessToken();
    token = accessToken?.token;
  } catch {
    // Forward requests without Authorization when no session is active.
    token = undefined;
  }

  const url = new URL(request.url);
  const target = `${BACKEND_URL}/${path.join("/")}${url.search}`;
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.text();

  const forwardedFor = clientIp(request);

  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
        "Content-Type": "application/json",
        Origin: process.env.APP_BASE_URL ?? "http://localhost:5173",
      },
      body: body || undefined,
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { message: "No pudimos conectarnos con el servidor." },
      { status: 502 },
    );
  }

  if (response.status === 204) return new Response(null, { status: 204 });

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}

/**
 * Forwards GET requests to the backend.
 */
export const GET = forward;
/**
 * Forwards POST requests to the backend.
 */
export const POST = forward;
/**
 * Forwards PATCH requests to the backend.
 */
export const PATCH = forward;
/**
 * Forwards DELETE requests to the backend.
 */
export const DELETE = forward;