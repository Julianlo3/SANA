import { httpClient } from "@/services/api/http-client";
import type {
  MyRequest,
  OwnProfile,
  UpdateOwnProfilePayload,
} from "../types/my-account-types";

/**
 * Retrieves own profile.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export async function getOwnProfile(signal?: AbortSignal): Promise<OwnProfile> {
  return httpClient.get<OwnProfile>("/users/me", signal);
}

/**
 * Updates the signed-in user's profile; email and identity document are immutable.
 * @param payload Data submitted to the operation.
 */
export async function updateOwnProfile(
  payload: UpdateOwnProfilePayload,
): Promise<void> {
  await httpClient.patch<unknown>("/users/me", payload);
}

/**
 * Lists my requests.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export async function listMyRequests(signal?: AbortSignal): Promise<MyRequest[]> {
  return httpClient.get<MyRequest[]>("/appointments/my-requests", signal);
}

/**
 * Withdraws a pending or assigned request, or cancels a confirmed appointment.
 * The backend applies the action allowed for the appointment state and account.
 * @param appId Resource identifier.
 */
export async function cancelMyRequest(appId: number): Promise<void> {
  await httpClient.patch<unknown>(`/appointments/${appId}/cancel`, {});
}