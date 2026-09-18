import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserStatus,
} from "../types/user-types";

type ApiUserRole = { id: number; name: string; active: boolean };
type ApiUser = Omit<User, "identityDocument" | "contactNumber" | "roles"> & {
  identityDocument: string | null;
  phone: string | null;
  roles: ApiUserRole[];
};

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

export async function getUsers(signal?: AbortSignal): Promise<User[]> {
  const response = await httpClient.get<ApiUser[]>(ENDPOINTS.users, signal);
  return response.map(normalizeUser);
}

export async function getUserById(
  id: number,
  signal?: AbortSignal,
): Promise<User | null> {
  const response = await httpClient.get<ApiUser>(ENDPOINTS.user(id), signal);
  return normalizeUser(response);
}

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

export async function changeUserStatus(
  id: number,
  status: UserStatus,
  reason?: string,
): Promise<void> {
  await httpClient.patch<void>(ENDPOINTS.userStatus(id), { status, reason });
}

export async function deleteUser(id: number): Promise<void> {
  await httpClient.remove<void>(ENDPOINTS.user(id));
}