import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  AvailableSlot,
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
 *
 * Nota:
 * getAvailableSlots y la creación automática de cita (HU-2.2.10)
 * dependen de un endpoint que el backend aún no ha construido.
 *
 * El mock permite probar los diferentes caminos del formulario:
 * - Solicitud sin cita.
 * - Solicitud con horario disponible y cita confirmada.
 */

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

const MOCK_DELAY_MS = 600;

/**
 * Simula el tiempo de respuesta de una petición al backend.
 */
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_DELAY_MS);
  });
}

/**
 * Genera un número de radicado de prueba.
 *
 * Formato:
 * DH-AAAA-NNNN
 *
 * Ejemplo:
 * DH-2026-4821
 */
function buildMockReference(): string {
  const year = new Date().getFullYear();
  const sequence = String(
    Math.floor(Math.random() * 9000) + 1000,
  );

  return `DH-${year}-${sequence}`;
}

/**
 * HU-2.2.10:
 * Obtiene los horarios que los psicólogos
 * han dejado disponibles para asignación.
 */
export async function getAvailableSlots(): Promise<
  AvailableSlot[]
> {
  if (USE_MOCKS) {
    const now = Date.now();

    const firstSlotStart = new Date(
      now + 2 * 24 * 60 * 60 * 1000,
    );

    const firstSlotEnd = new Date(
      firstSlotStart.getTime() + 45 * 60 * 1000,
    );

    const secondSlotStart = new Date(
      now + 3 * 24 * 60 * 60 * 1000,
    );

    const secondSlotEnd = new Date(
      secondSlotStart.getTime() + 45 * 60 * 1000,
    );

    return delay([
      {
        id: "slot-1",
        psychologistId: 5,
        psychologistName: "Miguel Castillo",
        startsAt: firstSlotStart.toISOString(),
        endsAt: firstSlotEnd.toISOString(),
      },
      {
        id: "slot-2",
        psychologistId: 5,
        psychologistName: "Miguel Castillo",
        startsAt: secondSlotStart.toISOString(),
        endsAt: secondSlotEnd.toISOString(),
      },
    ]);
  }

  return httpClient.get<AvailableSlot[]>(
    ENDPOINTS.availableSlots,
  );
}

/**
 * HU-2.2.2, HU-2.2.10 y HU-2.2.11:
 *
 * Envía una solicitud de consulta y devuelve
 * el comprobante de recepción.
 *
 * Si el usuario seleccionó un horario, el mock simula
 * que la cita fue confirmada.
 *
 * Si no seleccionó un horario, la solicitud queda pendiente.
 */
export async function submitConsultationRequest(
  payload: ConsultationRequestPayload,
): Promise<ConsultationRequestReceipt> {
  if (USE_MOCKS) {
    const appointmentConfirmed =
      payload.selectedSlotId !== null;

    return delay({
      referenceNumber: buildMockReference(),
      status: appointmentConfirmed ? "assigned" : "pending",
      submittedAt: new Date().toISOString(),
      appointmentConfirmed,
    });
  }

  return httpClient.post<ConsultationRequestReceipt>(
    ENDPOINTS.consultationRequests,
    payload,
  );
}