/** Standard response envelope returned by the backend. */
export type ApiCollection<T> = {
  data: T[];
  total?: number;
};

/**
 * Defines the api item type.
 */

export type ApiItem<T> = {
  data: T;
};

/** Normalized error consumed by application pages. */
export class ApiError extends Error {
  readonly status: number;
  /** Field errors returned by the backend, keyed by backend field name. */
  readonly fieldErrors: Record<string, string>;
  /** Optional backend business error code, such as `REQUESTER_MUST_BE_ADULT`. */
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