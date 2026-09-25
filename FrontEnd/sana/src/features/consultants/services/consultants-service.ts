import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  ConsultantAccessLogEntry,
  ConsultantFullRecord,
  ConsultantSummary,
} from "../types/consultant-types";

/**
 * Única puerta de entrada a los datos de consultantes.
 *
 * HU-2.4:
 * - La asistente recibe ConsultantSummary.
 * - El psicólogo tratante recibe ConsultantFullRecord.
 * - El backend es responsable de validar los permisos.
 *
 * Mientras USE_MOCKS esté activo, se utilizan datos de prueba.
 */

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
const MOCK_DELAY_MS = 500;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_DELAY_MS);
  });
}

/**
 * Datos de prueba para la vista resumida.
 *
 * No incluye:
 * - motivo de consulta
 * - observaciones clínicas
 * - historial clínico detallado
 */
const MOCK_SUMMARY: ConsultantSummary = {
  id: 1,
  fullName: "Mariana Vargas",
  identityDocument: "1075634892",
  email: "mariana.vargas@example.com",
  phone: "3124567890",
  residence: {
    department: "Huila",
    municipality: "Neiva",
  },
  status: "active",
  assignedPsychologistId: 5,
  assignedPsychologistName: "Miguel Castillo",
  lastAppointmentAt: "2026-09-18T15:00:00.000Z",
};

/**
 * Datos de prueba para la ficha completa del psicólogo.
 */
const MOCK_FULL_RECORD: ConsultantFullRecord = {
  ...MOCK_SUMMARY,
  consultationReason:
    "Reporta episodios de ansiedad relacionados con estrés laboral.",
  careRecords: [
    {
      id: 1,
      appointmentId: 10,
      attendedAt: "2026-09-18T15:00:00.000Z",
      observation: "Sesión de seguimiento.",
      recordedByPsychologistId: 5,
      recordedByPsychologistName: "Miguel Castillo",
    },
    {
      id: 2,
      appointmentId: 7,
      attendedAt: "2026-09-04T15:00:00.000Z",
      observation: null,
      recordedByPsychologistId: 5,
      recordedByPsychologistName: "Miguel Castillo",
    },
  ],
};

/**
 * HU-2.4.1
 *
 * Obtiene la información resumida de un consultante
 * para la asistente.
 */
export async function getConsultantForAssistant(
  id: number,
): Promise<ConsultantSummary> {
  if (USE_MOCKS) {
    return delay(MOCK_SUMMARY);
  }

  return httpClient.get<ConsultantSummary>(
    ENDPOINTS.consultantSummary(id),
  );
}

/**
 * HU-2.4.2
 *
 * Obtiene la ficha completa del consultante
 * para el psicólogo tratante.
 *
 * HU-2.4.3
 *
 * El backend debe verificar que el psicólogo
 * sea el profesional asignado.
 *
 * Si no tiene autorización, el backend debe
 * responder 403 Forbidden.
 */
export async function getConsultantForPsychologist(
  id: number,
): Promise<ConsultantFullRecord> {
  if (USE_MOCKS) {
    return delay(MOCK_FULL_RECORD);
  }

  return httpClient.get<ConsultantFullRecord>(
    ENDPOINTS.consultantFullRecord(id),
  );
}

/**
 * Listado de consultantes que puede visualizar
 * la asistente.
 */
export async function listConsultantsForAssistant(): Promise<
  ConsultantSummary[]
> {
  if (USE_MOCKS) {
    return delay([
      MOCK_SUMMARY,
      {
        ...MOCK_SUMMARY,
        id: 2,
        fullName: "Andrés Gómez",
        identityDocument: "1098234567",
        assignedPsychologistId: null,
        assignedPsychologistName: null,
        lastAppointmentAt: null,
      },
    ]);
  }

  return httpClient.get<ConsultantSummary[]>(
    ENDPOINTS.consultants,
  );
}

/**
 * Listado de consultantes asignados al psicólogo
 * que realiza la consulta.
 */
export async function listConsultantsForPsychologist(): Promise<
  ConsultantFullRecord[]
> {
  if (USE_MOCKS) {
    return delay([MOCK_FULL_RECORD]);
  }

  return httpClient.get<ConsultantFullRecord[]>(
    ENDPOINTS.consultantsForPsychologist,
  );
}

/**
 * HU-2.4.5
 *
 * Bitácora de accesos a la información del consultante.
 *
 * Es de solo lectura para el administrador.
 */
export async function getConsultantAccessLog(
  consultantId: number,
): Promise<ConsultantAccessLogEntry[]> {
  if (USE_MOCKS) {
    return delay([
      {
        id: 1,
        consultantId,
        userId: 5,
        userName: "Miguel Castillo",
        userRole: "psicologo",
        accessedAt: "2026-09-18T15:02:00.000Z",
      },
    ]);
  }

  return httpClient.get<ConsultantAccessLogEntry[]>(
    ENDPOINTS.consultantAccessLog(consultantId),
  );
}