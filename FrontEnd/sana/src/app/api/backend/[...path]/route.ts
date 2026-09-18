import { auth0 } from "@/lib/auth0";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000/api/v1";

async function forward(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const accessToken = await auth0.getAccessToken();

  if (!accessToken?.token) {
    return Response.json({ message: "La sesión terminó." }, { status: 401 });
  }

  const url = new URL(request.url);
  const target = `${BACKEND_URL}/${path.join("/")}${url.search}`;
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.text();

  const response = await fetch(target, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
      Origin: process.env.APP_BASE_URL ?? "http://localhost:5173",
    },
    body: body || undefined,
    cache: "no-store",
  });

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