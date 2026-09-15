/** Estados de public.person.per_state. */
export type UserStatus = "active" | "inactive" | "blocked";

export type AssignedRole = {
  id: number;
  /** Si el rol está habilitado en este momento para la persona. */
  isActive: boolean;
};

export type ProfessionalData = {
  licenseNumber: string;
  speciality: string;
};

export type User = {
  id: number;
  fullName: string;
  identityDocument: string;
  email: string;
  contactNumber: string;
  roles: AssignedRole[];
  status: UserStatus;
  /** ISO 8601 UTC. El formato para pantalla lo resuelve lib/format. */
  lastLoginAt: string | null;
  professionalData?: ProfessionalData;
};

/** Cuerpo de POST /users. */
export type CreateUserPayload = {
  fullName: string;
  identityDocument: string;
  email: string;
  contactNumber: string;
  roleIds: number[];
  professionalData?: ProfessionalData;
};

/** Cuerpo de PATCH /users/:id. Solo viajan los campos que cambiaron. */
export type UpdateUserPayload = Partial<
  Omit<CreateUserPayload, "email" | "identityDocument">
> & {
  roles?: AssignedRole[];
};

export type UserAction =
  | "edit"
  | "block"
  | "deactivate"
  | "reactivate"
  | "delete";