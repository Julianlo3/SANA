import { httpClient } from "@/services/api/http-client";
import { ENDPOINTS } from "@/services/api/endpoints";
import { suggestCarePackage } from "@/features/care-packages/services/care-packages-service";
import type { SuggestCarePackagePayload } from "@/features/care-packages/types/care-package-types";
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
 * Endpoint used to register a clinical note.
 */
const REGISTER_ATTENTION_PATH = "/clinical-notes/register-attention";

/**
 * Lists confirmed appointments awaiting care completion and documentation.
 * @param signal Optional request cancellation signal.
 * @returns A promise resolving to the psychologist's confirmed appointments.
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
 * Marks a non-assessment appointment as completed.
 * @param appId Identifier of the appointment to complete.
 * @returns A promise resolving when the appointment is completed.
 */
export async function completeAppointment(
  appId: number,
): Promise<void> {
  await httpClient.patch<unknown>(ENDPOINTS.appointmentComplete(appId), {});
}

/**
 * Marks an assessment as completed and creates its package suggestion.
 * The backend performs both operations atomically.
 * @param payload Assessment identifier and psychologist recommendation.
 * @returns A promise resolving to the suggested package.
 */
export async function suggestPackageAfterAssessment(
  payload: SuggestCarePackagePayload,
): Promise<void> {
  await suggestCarePackage(payload);
}

/**
 * Records a care note for an appointment already marked as completed.
 * @param payload Clinical note data and terms acceptance.
 * @returns A promise resolving when the note is recorded.
 */
export async function recordCare(payload: RecordCarePayload): Promise<void> {
  await httpClient.post<unknown>(REGISTER_ATTENTION_PATH, payload);
}