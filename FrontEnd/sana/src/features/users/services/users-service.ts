import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  CreateUserPayload,
  EditableUserStatus,
  UpdateUserPayload,
  User,
} from "../types/user-types";

/**
 * Defines the api user role type.
 */
type ApiUserRole = { id: number; name: string; active: boolean };
/**
 * Defines the api user type.
 */
type ApiUser = Omit<User, "identityDocument" | "contactNumber" | "roles"> & {
  identityDocument: string | null;
  phone: string | null;
  roles: ApiUserRole[];
};

/**
 * Implements the normalize user operation.
 * @param user User data.
 * @returns Result of the operation.
 */
function normalizeUser(user: ApiUser): User {
  return {
    ...user,
    identityDocument: user.identityDocument ?? "",
    contactNumber: user.phone ?? "",
    roles: user.roles.map((role) => ({
      id: role.id,
      name: role.name,
      isActive: role.active,
    })),
  };
}

/**
 * Retrieves users.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export async function getUsers(signal?: AbortSignal): Promise<User[]> {
  const response = await httpClient.get<ApiUser[]>(ENDPOINTS.users, signal);
  return response.map(normalizeUser);
}

/**
 * Retrieves user by id.
 * @param id Resource identifier.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export async function getUserById(
  id: number,
  signal?: AbortSignal,
): Promise<User | null> {
  const response = await httpClient.get<ApiUser>(ENDPOINTS.user(id), signal);
  return normalizeUser(response);
}

/**
 * Creates user.
 * @param payload Data submitted to the operation.
 * @returns A promise resolving to the operation result.
 */

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await httpClient.post<ApiUser>(ENDPOINTS.users, {
    fullName: payload.fullName,
    identityDocument: payload.identityDocument,
    email: payload.email,
    phone: payload.contactNumber,
    roleId: payload.roleIds[0],
    professionalData: payload.professionalData,
  });
  return normalizeUser(response);
}

/**
 * Updates update user.
 * @param id id identifier.
 * @param payload Data sent to the operation.
 * @returns A promise resolving to the operation result.
 */
export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<User> {
  const response = await httpClient.patch<ApiUser>(ENDPOINTS.user(id), {
    fullName: payload.fullName,
    phone: payload.contactNumber,
    roles: payload.roles?.map((role) => ({
      roleId: role.id,
      active: role.isActive,
    })),
    professionalData: payload.professionalData,
  });
  return normalizeUser(response);
}

/**
 * Implements the change user status operation.
 * @param id Resource identifier.
 * @param status Current status value.
 * @param reason Optional. reason input.
 */

export async function changeUserStatus(
  id: number,
  status: EditableUserStatus,
  reason?: string,
): Promise<void> {
  await httpClient.patch<void>(ENDPOINTS.userStatus(id), { status, reason });
}

/**
 * Deletes user.
 * @param id Resource identifier.
 */

export async function deleteUser(id: number): Promise<void> {
  await httpClient.remove<void>(ENDPOINTS.user(id));
}
