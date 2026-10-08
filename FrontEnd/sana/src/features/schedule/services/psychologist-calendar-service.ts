import { httpClient } from "@/services/api/http-client";
import type { PsychologistCalendar } from "../types/psychologist-calendar-types";

/** Calendario de un psicólogo elegido por la asistente. */
export async function getPsychologistCalendar(
  psychologistId: number,
  signal?: AbortSignal,
): Promise<PsychologistCalendar> {
  return httpClient.get<PsychologistCalendar>(
    `/schedule/psychologists/${psychologistId}/calendar`,
    signal,
  );
}