import { ApiError } from "@/types/api-types";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

const API_URL = "/api/backend";

/** Mensajes por código HTTP, en lenguaje de usuario. */
const STATUS_MESSAGES: Record<number, string> = {
  400: "La información enviada no es válida.",
  401: "La sesión terminó. Vuelve a iniciar sesión.",
  403: "No tienes permisos para hacer esta acción.",
  404: "No encontramos lo que buscabas.",
  422: "Revisa los datos marcados en el formulario.",
  500: "Algo falló en el servidor. Intenta de nuevo en unos minutos.",
};

/**
 * Único punto por el que la aplicación habla con el backend.
 * Las pantallas nunca llaman fetch directamente.
 */
export async function request<T>(
  path: string,
  { method = "GET", body, signal }: RequestOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("No pudimos conectarnos con el servidor.", 0);
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const details = payload as {
      message?: string;
      errors?: Record<string, string>;
    } | null;

    throw new ApiError(
      details?.message ??
        STATUS_MESSAGES[response.status] ??
        "Ocurrió un error inesperado.",
      response.status,
      details?.errors ?? {},
    );
  }

  return payload as T;
}

export const httpClient = {
  get: <T>(path: string, signal?: AbortSignal) =>
    request<T>(path, { method: "GET", signal }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  remove: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};