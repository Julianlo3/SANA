import { httpClient } from "@/services/api/http-client";
import type {
  CreateRecurringScheduleBlockPayload,
  CreateScheduleBlockPayload,
  RecurringScheduleBlock,
  ScheduleBlock,
} from "../types/schedule-types";

/**
 * Agenda del psicólogo autenticado. Habla con /schedule/me/..., sin mocks,
 * contra el backend real.
 */

export async function getMyBlocks(signal?: AbortSignal): Promise<ScheduleBlock[]> {
  return httpClient.get<ScheduleBlock[]>("/schedule/me/blocks", signal);
}

export async function createMyBlock(
  payload: CreateScheduleBlockPayload,
): Promise<ScheduleBlock> {
  return httpClient.post<ScheduleBlock>("/schedule/me/blocks", payload);
}

export async function deleteMyBlock(id: number): Promise<void> {
  await httpClient.remove<void>(`/schedule/me/blocks/${id}`);
}

export async function getMyRecurringBlocks(
  signal?: AbortSignal,
): Promise<RecurringScheduleBlock[]> {
  return httpClient.get<RecurringScheduleBlock[]>(
    "/schedule/me/recurring-blocks",
    signal,
  );
}

export async function createMyRecurringBlock(
  payload: CreateRecurringScheduleBlockPayload,
): Promise<RecurringScheduleBlock> {
  return httpClient.post<RecurringScheduleBlock>(
    "/schedule/me/recurring-blocks",
    payload,
  );
}

export async function deleteMyRecurringBlock(id: number): Promise<void> {
  await httpClient.remove<void>(`/schedule/me/recurring-blocks/${id}`);
}

/** Términos de uso de la agenda (schedule_terms): el psicólogo debe aceptarlos antes de poder usar su calendario. */
export async function getScheduleTermsStatus(
  signal?: AbortSignal,
): Promise<{ hasAccepted: boolean }> {
  return httpClient.get<{ hasAccepted: boolean }>(
    "/schedule/me/terms-status",
    signal,
  );
}

export async function acceptScheduleTerms(): Promise<void> {
  await httpClient.post<void>("/schedule/me/accept-terms", {});
}