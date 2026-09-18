export interface UserRoleResponse {
  id: number;
  name: string;
  active: boolean;
}

export interface UserResponse {
  id: number;
  fullName: string;
  identityDocument: string | null;
  email: string;
  phone: string | null;
  roles: UserRoleResponse[];
  status: 'active' | 'inactive' | 'blocked' | 'pending';
  lastLoginAt: string | null;
  emailVerified: boolean | null;
  createdAt: string;
  createdBy: number | null;
}
