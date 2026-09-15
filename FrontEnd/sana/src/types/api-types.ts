/**
 * El backend responde con objetos y arreglos planos, sin envoltura { data }.
 * Se dejan estos alias para que quede explícito en las firmas.
 */
export type ApiCollection<T> = T[];
export type ApiItem<T> = T;

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