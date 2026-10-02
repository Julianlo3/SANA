import { auth0 } from "@/lib/auth0";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000/api/v1";

/**
 * Proxy hacia el backend. Reenvía con el token de sesión si existe, y sin
 * él si no hay sesión activa (el formulario público de solicitud de cita
 * y la consulta de políticas no requieren login). El backend decide, con
 * sus propios guards, si la ruta necesita autenticación: si la necesita y
 * no llega token, responde 401 por su cuenta.
 *
 * auth0.getAccessToken() lanza AccessTokenError cuando no hay sesión, en
 * vez de devolver null — por eso va en try/catch, no en un if.
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
    // Sin sesión activa: se reenvía sin Authorization. El backend decide.
    token = undefined;
  }

  const url = new URL(request.url);
  const target = `${BACKEND_URL}/${path.join("/")}${url.search}`;
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.text();

  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;