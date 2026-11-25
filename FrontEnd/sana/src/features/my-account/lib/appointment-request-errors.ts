import { ApiError } from "@/types/api-types";

/**
 * Converts appointment request business errors into guidance for the patient.
 * @param error Error returned by the appointment request API.
 * @param fallback Message used when the error has no API code.
 * @returns A user-facing message describing the request failure.
 */
export function appointmentRequestErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiError)) return fallback;

  const messages: Record<string, string> = {
    ACTIVE_CARE_PACKAGE_EXISTS:
      "Este paciente tiene un paquete activo. Agenda sus sesiones desde «Mis paquetes».",
    FOLLOW_UP_VALUATION_REQUIRED_WITH_TREATING_PSYCHOLOGIST:
      "La valoración de continuidad debe agendarse desde «Mis paquetes» con el psicólogo tratante.",
    SUGGESTED_CARE_PACKAGE_PENDING:
      "Hay una sugerencia de paquete pendiente de revisión por secretaría.",
    VALUATION_ALREADY_IN_PROGRESS:
      "Este paciente ya tiene una valoración en curso.",
    NEWER_CARE_PACKAGE_EXISTS:
      "Solicita la valoración desde el paquete finalizado más reciente.",
  };

  return messages[error.code ?? ""] ?? error.message;
}
