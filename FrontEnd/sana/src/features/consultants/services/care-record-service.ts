import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";

import type {
  CareRecordReceipt,
  PsychologistAppointment,
  RecordCarePayload,
} from "../types/care-record-types";

/**
 * Única puerta de entrada al registro de atenciones (HU-2.5).
 *
 * Solo puede registrarse una atención sobre citas que estén
 * en estado "completed" (HU-2.5.7).
 *
 * Esta regla debe hacerla cumplir el backend.
 * El frontend únicamente envía la petición.
 */

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
const MOCK_DELAY_MS = 500;

/**
 * Simula un tiempo de respuesta del backend.
 */
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, MOCK_DELAY_MS);
  });
}

/**
 * Datos de prueba para la agenda del psicólogo.
 *
 * Casos incluidos:
 *
 * - Cita 10: completada y con registro de atención.
 * - Cita 11: completada y sin registro de atención.
 * - Cita 12: programada y sin registro de atención.
 */
const MOCK_APPOINTMENTS: PsychologistAppointment[] = [
  {
    id: 10,
    consultantId: 1,
    consultantName: "Mariana Vargas",
    scheduledAt: "2026-09-18T15:00:00.000Z",
    status: "completed",
    careRecord: {
      observation: "Sesión de seguimiento.",
      recordedAt: "2026-09-18T15:45:00.000Z",
    },
  },

  {
    id: 11,
    consultantId: 2,
    consultantName: "Andrés Gómez",
    scheduledAt: "2026-09-24T10:00:00.000Z",
    status: "completed",
    careRecord: null,
  },

  {
    id: 12,
    consultantId: 1,
    consultantName: "Mariana Vargas",
    scheduledAt: "2026-09-30T09:00:00.000Z",
    status: "scheduled",
    careRecord: null,
  },
];

/**
 * Obtiene la agenda del psicólogo.
 *
 * Permite seleccionar la cita sobre la cual
 * se registrará la atención.
 */
export async function listPsychologistAppointments(): Promise<
  PsychologistAppointment[]
> {
  if (USE_MOCKS) {
    return delay(MOCK_APPOINTMENTS);
  }

  return httpClient.get<PsychologistAppointment[]>(
    ENDPOINTS.psychologistAppointments,
  );
}

/**
 * HU-2.5.1
 *
 * Registra una atención sobre una cita que ya fue realizada.
 *
 * HU-2.5.7
 *
 * El backend debe rechazar la operación si la cita
 * no está en estado "completed".
 *
 * El frontend no realiza esta validación de permisos
 * o estado como mecanismo de seguridad.
 */
export async function recordCare(
  payload: RecordCarePayload,
): Promise<CareRecordReceipt> {
  if (USE_MOCKS) {
    const now = new Date().toISOString();

    return delay({
      id: Math.floor(Math.random() * 1000),
      appointmentId: payload.appointmentId,
      attendedAt: now,
      recordedAt: now,
    });
  }

  return httpClient.post<CareRecordReceipt>(
    ENDPOINTS.careRecords,
    payload,
  );
}