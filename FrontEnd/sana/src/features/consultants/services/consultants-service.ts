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
 */

type ConsultantApiResponse = {
  id: number;
  fullName: string;
  identityDocument: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "blocked" | "pending";
  appointmentCount: number;
  lastAppointmentDate: string | null;
  assignedPsychologistName: string | null;
};

/**
 * Converts a consultant API response to a consultant summary.
 * @param consultant The consultant API response to convert.
 * @returns The consultant summary.
 */
function toConsultantSummary(
  consultant: ConsultantApiResponse,
): ConsultantSummary {
  return {
    id: consultant.id,
    fullName: consultant.fullName,
    identityDocument: consultant.identityDocument,
    email: consultant.email,
    phone: consultant.phone,
    residence: null,
    status: consultant.status === "active" ? "active" : "inactive",
    assignedPsychologistId: null,
    assignedPsychologistName: consultant.assignedPsychologistName,
    lastAppointmentAt: consultant.lastAppointmentDate,
    appointmentCount: consultant.appointmentCount,
  };
}

/**
 * Gets the summary of a consultant for the assistant.
 * @param id The id of the consultant to get.
 * @returns The summary of the consultant for the authenticated assistant.
 */
export async function getConsultantForAssistant(
  id: number,
): Promise<ConsultantSummary> {
  const consultant = await httpClient.get<ConsultantApiResponse>(
    ENDPOINTS.consultantSummary(id),
  );
  return toConsultantSummary(consultant);
}

/**
 * Gets the full record of a consultant for the psychologist.
 * @param id The id of the consultant to get.
 * @returns The full record of the consultant for the authenticated psychologist.
 */
export async function getConsultantForPsychologist(
  id: number,
): Promise<ConsultantFullRecord> {
  return httpClient.get<ConsultantFullRecord>(
    ENDPOINTS.consultantFullRecord(id),
  );
}

/**
 * Lists consultants that can be viewed by the assistant.
 * @returns A list of consultant summaries for the authenticated assistant.
 */
export async function listConsultantsForAssistant(): Promise<
  ConsultantSummary[]
> {
  const consultants = await httpClient.get<ConsultantApiResponse[]>(
    ENDPOINTS.consultants,
  );
  return consultants.map(toConsultantSummary);
}

/**
 * list of consultants that can be viewed by the psychologist.
 * @returns A list of consultant summaries for the authenticated psychologist.
 */
export async function listConsultantsForPsychologist(): Promise<
  ConsultantSummary[]
> {
  return httpClient.get<ConsultantSummary[]>(
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
  return httpClient.get<ConsultantAccessLogEntry[]>(
    ENDPOINTS.consultantAccessLog(consultantId),
  );
}