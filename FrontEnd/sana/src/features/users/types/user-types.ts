/** Estados de public.person.per_state. */
export type UserStatus = "active" | "inactive" | "blocked" | "pending";
/**
 * Defines the editable user status type.
 */

export type EditableUserStatus = Extract<UserStatus, "active" | "inactive">;

/**
 * Defines the assigned role type.
 */

export type AssignedRole = {
  id: number;
  name?: string;
  /** Whether the role is currently enabled for the user. */
  isActive: boolean;
};

/**
 * Defines the professional data type.
 */

export type ProfessionalData = {
  licenseNumber: string;
  speciality: string;
};

/**
 * Defines the user type.
 */

export type User = {
  id: number;
  fullName: string;
  identityDocument: string;
  email: string;
  contactNumber: string;
  roles: AssignedRole[];
  status: UserStatus;
  /** ISO 8601 UTC timestamp; display formatting is handled by `lib/format`. */
  lastLoginAt: string | null;
  professionalData?: ProfessionalData;
  /** Present and true when user creation reactivated a blocked account. */
  wasReactivated?: boolean;
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

/** Payload for updating only the user fields that changed. */
export type UpdateUserPayload = Partial<
  Omit<CreateUserPayload, "email" | "identityDocument">
> & {
  roles?: AssignedRole[];
};

/**
 * Defines the user action type.
 */

export type UserAction = "edit" | "deactivate" | "enable" | "delete";
