export interface UserRoleResponse {
  id: number;
  name: string;
  active: boolean;
}

export interface UserResponse {
  id: number;
  fullName: string;
  cardType: string | null;
  identityDocument: string | null;
  email: string;
  phone: string | null;
  birthdate: string | null;
  gender: string | null;
  termsAccepted: boolean;
  roles: UserRoleResponse[];
  status: 'active' | 'inactive' | 'blocked' | 'pending';
  lastLoginAt: string | null;
  emailVerified: boolean | null;
  createdAt: string;
  createdBy: number | null;
  professionalData?: {
    licenseNumber: string;
    speciality: string;
    termsAccepted?: boolean;
  };
}
