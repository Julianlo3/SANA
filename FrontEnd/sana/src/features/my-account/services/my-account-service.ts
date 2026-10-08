import { httpClient } from "@/services/api/http-client";
import type {
  MyRequest,
  OwnProfile,
  UpdateOwnProfilePayload,
} from "../types/my-account-types";

/** Perfil de la persona que inició sesión. */
export async function getOwnProfile(signal?: AbortSignal): Promise<OwnProfile> {
  return httpClient.get<OwnProfile>("/users/me", signal);
}

/** Actualiza el perfil propio. El backend ignora y rechaza cualquier intento de tocar correo o documento. */
export async function updateOwnProfile(
  payload: UpdateOwnProfilePayload,
): Promise<void> {
  await httpClient.patch<unknown>("/users/me", payload);
}

/** Solicitudes de cita hechas por la persona que inició sesión. */
export async function listMyRequests(signal?: AbortSignal): Promise<MyRequest[]> {
  return httpClient.get<MyRequest[]>("/appointments/my-requests", signal);
}

/**
 * Retira una solicitud pendiente o asignada, o cancela una cita confirmada.
 * El backend decide qué hacer según el estado y solo deja actuar sobre las
 * citas pedidas por la propia cuenta.
 */
export async function cancelMyRequest(appId: number): Promise<void> {
  await httpClient.patch<unknown>(`/appointments/${appId}/cancel`, {});
}