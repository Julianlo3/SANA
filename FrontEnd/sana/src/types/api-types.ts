/** Envoltura estándar de las respuestas del backend. */
export type ApiCollection<T> = {
  data: T[];
  total?: number;
};

export type ApiItem<T> = {
  data: T;
};

/** Error normalizado que consumen las pantallas. */
export class ApiError extends Error {
  readonly status: number;
  /** Errores por campo devueltos por el backend, con el nombre del campo del backend. */
  readonly fieldErrors: Record<string, string>;
  /** Código de error de negocio del backend (por ejemplo REQUESTER_MUST_BE_ADULT), si lo envía. */
  readonly code: string | null;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
    code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
  }
}