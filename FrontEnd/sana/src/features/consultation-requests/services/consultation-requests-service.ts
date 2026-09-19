import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  ConsultationRequestPayload,
  ConsultationRequestReceipt,
} from "../types/consultation-request-types";

/**
 * Única puerta de entrada para las operaciones relacionadas
 * con las solicitudes de consulta.
 *
 * Mientras USE_MOCKS esté activo, se utilizan datos de prueba.
 * Cuando la bandera se desactiva, las mismas funciones consumen
 * la API real sin necesidad de modificar las pantallas.
 */

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
const MOCK_DELAY_MS = 600;

/** Simula el tiempo de respuesta de una petición al backend. */
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_DELAY_MS);
  });
}

/**
 * Genera un número de radicado de prueba.
 *
 * Formato: DH-AAAA-NNNN
 * Ejemplo: DH-2026-4821
 */
function buildMockReference(): string {
  const year = new Date().getFullYear();
  const sequence = String(Math.floor(Math.random() * 9000) + 1000);

  return `DH-${year}-${sequence}`;
}

/**
 * HU-2.2.2:
 * Envía una solicitud de consulta y devuelve
 * el comprobante con su número de radicado.
 */
export async function submitConsultationRequest(
  payload: ConsultationRequestPayload,
): Promise<ConsultationRequestReceipt> {
  if (USE_MOCKS) {
    return delay({
      referenceNumber: buildMockReference(),
      status: "pending" as const,
      submittedAt: new Date().toISOString(),
    });
  }

  return httpClient.post<ConsultationRequestReceipt>(
    ENDPOINTS.consultationRequests,
    payload,
  );
}