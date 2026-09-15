import { USERS_MOCK } from "@/lib/mocks/users-mock";
import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type { ApiCollection, ApiItem } from "@/types/api-types";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserStatus,
} from "../types/user-types";

/**
 * Única puerta de entrada a los datos de usuarios.
 * Las pantallas y los hooks llaman aquí; nadie más arma URLs ni toca los mocks.
 *
 * Mientras USE_MOCKS esté activo responde con datos de prueba, así el frontend
 * avanza sin depender del backend. Al apagar la bandera, las mismas funciones
 * pegan contra la API real sin cambiar una sola pantalla.
 *
 * Nota: el backend todavía no expone /users, así que estos endpoints están
 * escritos contra el contrato acordado pero aún no se han probado.
 */

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
const MOCK_DELAY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_DELAY_MS),
  );
}

export async function getUsers(signal?: AbortSignal): Promise<User[]> {
  if (USE_MOCKS) return delay(USERS_MOCK);

  return httpClient.get<ApiCollection<User>>(ENDPOINTS.users, signal);
}

export async function getUserById(
  id: number,
  signal?: AbortSignal,
): Promise<User | null> {
  if (USE_MOCKS) {
    return delay(USERS_MOCK.find((user) => user.id === id) ?? null);
  }

 return httpClient.get<ApiItem<User>>(ENDPOINTS.user(id), signal);
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  if (USE_MOCKS) {
    return delay({
      ...payload,
      id: Date.now(),
      roles: payload.roleIds.map((id) => ({ id, isActive: true })),
      status: "active" as UserStatus,
      lastLoginAt: null,
    });
  }

 return httpClient.post<ApiItem<User>>(ENDPOINTS.users, payload);
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<void> {
  if (USE_MOCKS) {
    await delay(null);
    return;
  }

  await httpClient.patch<void>(ENDPOINTS.user(id), payload);
}

export async function changeUserStatus(
  id: number,
  status: UserStatus,
  reason?: string,
): Promise<void> {
  if (USE_MOCKS) {
    await delay(null);
    return;
  }

  await httpClient.patch<void>(ENDPOINTS.userStatus(id), { status, reason });
}

export async function deleteUser(id: number): Promise<void> {
  if (USE_MOCKS) {
    await delay(null);
    return;
  }

  await httpClient.remove<void>(ENDPOINTS.user(id));
}