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
  /** Errores por campo devueltos por el backend en un 422. */
  readonly fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}