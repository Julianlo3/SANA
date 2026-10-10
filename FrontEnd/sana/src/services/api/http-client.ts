import { ApiError } from "@/types/api-types";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

type BackendFieldIssue = {
  property?: string;
  constraints?: Record<string, string>;
};

type BackendErrorBody = {
  message?: unknown;
  error?: unknown;
  errors?: Record<string, string>;
} | null;

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

/** Qué dice cada regla de validación del backend, en lenguaje de usuario. */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  isNotEmpty: "Este dato es obligatorio.",
  isEmail: "Escribe un correo válido, por ejemplo nombre@correo.com.",
  matches: "El formato de este dato no es válido.",
  isIn: "Selecciona una opción válida.",
  isEnum: "Selecciona una opción válida.",
  isInt: "Escribe un número válido.",
  minLength: "Este dato es demasiado corto.",
  maxLength: "Este dato es demasiado largo.",
  min: "Este valor es demasiado bajo.",
  max: "Este valor es demasiado alto.",
  isDateString: "La fecha no es válida.",
  isString: "Este dato no es válido.",
  isBoolean: "Este dato no es válido.",
};

/** Orden en que se elige la regla a mostrar cuando un campo incumple varias. */
const CONSTRAINT_PRIORITY = Object.keys(CONSTRAINT_MESSAGES);

/** Convierte la lista de campos con error que envía el backend en un mapa campo → mensaje. */
function readFieldIssues(message: unknown): Record<string, string> {
  if (!Array.isArray(message)) return {};

  const result: Record<string, string> = {};

  for (const item of message) {
    if (typeof item !== "object" || item === null) continue;

    const issue = item as BackendFieldIssue;
    if (!issue.property || !issue.constraints) continue;

    const rule = CONSTRAINT_PRIORITY.find((key) => key in issue.constraints!);
    result[issue.property] =
      (rule && CONSTRAINT_MESSAGES[rule]) || "Este dato no es válido.";
  }

  return result;
}

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
    const details = payload as BackendErrorBody;

    const message =
      typeof details?.message === "string"
        ? details.message
        : (STATUS_MESSAGES[response.status] ?? "Ocurrió un error inesperado.");

    throw new ApiError(
      message,
      response.status,
      details?.errors ?? readFieldIssues(details?.message),
      typeof details?.error === "string" ? details.error : null,
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