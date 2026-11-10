import { httpClient } from "@/services/api/http-client";
import type { PsychologistCalendar } from "../types/psychologist-calendar-types";

/**
 * Retrieves psychologist calendar.
 * @param psychologistId Resource identifier.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export async function getPsychologistCalendar(
  psychologistId: number,
  signal?: AbortSignal,
): Promise<PsychologistCalendar> {
  return httpClient.get<PsychologistCalendar>(
    `/schedule/psychologists/${psychologistId}/calendar`,
    signal,
  );
}