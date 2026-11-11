import { httpClient } from "@/services/api/http-client";
import type {
  CreateRecurringScheduleBlockPayload,
  CreateScheduleBlockPayload,
  RecurringScheduleBlock,
  ScheduleBlock,
} from "../types/schedule-types";

/**
 * Provides schedule operations for the authenticated psychologist through the
 * `/schedule/me/...` endpoints.
 * @param signal Optional request cancellation signal.
 * @returns The psychologist's availability blocks.
 */

export async function getMyBlocks(signal?: AbortSignal): Promise<ScheduleBlock[]> {
  return httpClient.get<ScheduleBlock[]>("/schedule/me/blocks", signal);
}

/**
 * Creates a one-time availability block for the authenticated psychologist.
 * @param payload Data submitted to the operation.
 * @returns The created availability block.
 */

export async function createMyBlock(
  payload: CreateScheduleBlockPayload,
): Promise<ScheduleBlock> {
  return httpClient.post<ScheduleBlock>("/schedule/me/blocks", payload);
}

/**
 * Deletes a one-time availability block.
 * @param id Resource identifier.
 */

export async function deleteMyBlock(id: number): Promise<void> {
  await httpClient.remove<void>(`/schedule/me/blocks/${id}`);
}

/**
 * Retrieves recurring availability blocks for the authenticated psychologist.
 * @param signal Optional request cancellation signal.
 * @returns The psychologist's recurring availability blocks.
 */

export async function getMyRecurringBlocks(
  signal?: AbortSignal,
): Promise<RecurringScheduleBlock[]> {
  return httpClient.get<RecurringScheduleBlock[]>(
    "/schedule/me/recurring-blocks",
    signal,
  );
}

/**
 * Creates a recurring availability block for the authenticated psychologist.
 * @param payload Data submitted to the operation.
 * @returns The created recurring availability block.
 */

export async function createMyRecurringBlock(
  payload: CreateRecurringScheduleBlockPayload,
): Promise<RecurringScheduleBlock> {
  return httpClient.post<RecurringScheduleBlock>(
    "/schedule/me/recurring-blocks",
    payload,
  );
}

/**
 * Deletes a recurring availability block.
 * @param id Resource identifier.
 */

export async function deleteMyRecurringBlock(id: number): Promise<void> {
  await httpClient.remove<void>(`/schedule/me/recurring-blocks/${id}`);
}

/**
 * Retrieves whether the psychologist has accepted the schedule terms.
 * @param signal Optional request cancellation signal.
 * @returns The schedule terms acceptance status.
 */
export async function getScheduleTermsStatus(
  signal?: AbortSignal,
): Promise<{ hasAccepted: boolean }> {
  return httpClient.get<{ hasAccepted: boolean }>(
    "/schedule/me/terms-status",
    signal,
  );
}

/**
 * Records acceptance of the schedule terms.
 */
export async function acceptScheduleTerms(): Promise<void> {
  await httpClient.post<void>("/schedule/me/accept-terms", {});
}