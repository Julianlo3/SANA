import { httpClient } from "@/services/api/http-client";
import { ENDPOINTS } from "@/services/api/endpoints";
import type {
  PackageSuggestionPayload,
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
 * Marks an appointment as completed; only its assigned psychologist can do so.
 * @param appId Identifier of the appointment to complete.
 * @param packageSuggestion Optional priority and session count for an assessment.
 * @returns A promise resolving when the appointment is completed.
 */
export async function completeAppointment(
  appId: number,
  packageSuggestion?: PackageSuggestionPayload,
): Promise<void> {
  await httpClient.patch<unknown>(
    ENDPOINTS.appointmentComplete(appId),
    packageSuggestion ?? {},
  );
}

/**
 * Records a care note for an appointment already marked as completed.
 * @param payload Clinical note data and terms acceptance.
 * @returns A promise resolving when the note is recorded.
 */
export async function recordCare(payload: RecordCarePayload): Promise<void> {
  await httpClient.post<unknown>(REGISTER_ATTENTION_PATH, payload);
}