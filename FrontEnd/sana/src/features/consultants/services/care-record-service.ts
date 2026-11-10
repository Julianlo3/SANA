import { httpClient } from "@/services/api/http-client";
import type {
  PsychologistAppointment,
  RecordCarePayload,
} from "../types/care-record-types";

/**
 * Central service for psychologist appointments and care records.
 *
 * Paths are defined locally because the shared endpoint catalog contains
 * legacy routes that are not available in the backend.
 */
const MY_APPOINTMENTS_PATH = "/appointments/my-appointments";
/**
 * Defines the register attention path.
 */
const REGISTER_ATTENTION_PATH = "/clinical-notes/register-attention";

/**
 * Implements the complete path operation.
 * @param appId Resource identifier.
 * @returns Formatted value or validation message.
 */
function completePath(appId: number): string {
  return `/appointments/${appId}/complete`;
}

/**
 * Lists confirmed appointments awaiting care completion and documentation.
 * @param signal Optional request cancellation signal. (optional)
 * @returns A promise resolving to the operation result.
 */
export async function listPsychologistAppointments(
  signal?: AbortSignal,
): Promise<PsychologistAppointment[]> {
  return httpClient.get<PsychologistAppointment[]>(
    `${MY_APPOINTMENTS_PATH}?state=confirmada`,
    signal,
  );
}

/**
 * Marks an appointment as completed; only its assigned psychologist can do so.
 * @param appId Resource identifier.
 */
export async function completeAppointment(appId: number): Promise<void> {
  await httpClient.patch<unknown>(completePath(appId), {});
}

/**
 * Records a care note for an appointment already marked as completed.
 * @param payload Data submitted to the operation.
 */
export async function recordCare(payload: RecordCarePayload): Promise<void> {
  await httpClient.post<unknown>(REGISTER_ATTENTION_PATH, payload);
}