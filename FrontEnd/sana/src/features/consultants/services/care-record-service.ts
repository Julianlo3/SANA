import { httpClient } from "@/services/api/http-client";
import type {
  PsychologistAppointment,
  RecordCarePayload,
} from "../types/care-record-types";

/**
 * Única puerta de entrada al registro de atenciones (HU-2.5).
 * Habla con el backend real, sin mocks.
 *
 * Las rutas viven aquí porque ENDPOINTS todavía trae dos entradas viejas
 * (/appointments/mine y /care-records) que no existen en el backend.
 */
const MY_APPOINTMENTS_PATH = "/appointments/my-appointments";
const REGISTER_ATTENTION_PATH = "/clinical-notes/register-attention";

function completePath(appId: number): string {
  return `/appointments/${appId}/complete`;
}

/** Citas confirmadas del psicólogo, pendientes de atender y registrar. */
export async function listPsychologistAppointments(
  signal?: AbortSignal,
): Promise<PsychologistAppointment[]> {
  return httpClient.get<PsychologistAppointment[]>(
    `${MY_APPOINTMENTS_PATH}?state=confirmada`,
    signal,
  );
}

/** Paso 1: marca la cita como realizada. Solo el psicólogo asignado, y solo desde "confirmada". */
export async function completeAppointment(appId: number): Promise<void> {
  await httpClient.patch<unknown>(completePath(appId), {});
}

/** Paso 2: guarda la observación. El backend exige que la cita ya esté realizada. */
export async function recordCare(payload: RecordCarePayload): Promise<void> {
  await httpClient.post<unknown>(REGISTER_ATTENTION_PATH, payload);
}