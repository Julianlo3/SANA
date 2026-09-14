export type UserStatus = "active" | "inactive" | "blocked";

export type UserRole = {
  id: number;
  name: string;
  active: boolean;
};

export type User = {
  id: number;
  fullName: string;
  identityDocument: string;
  email: string;
  phone: string;
  roles: UserRole[];
  status: UserStatus;
  lastLoginAt: string;
};

export const ROLE_CATALOG = [
  { id: 4, name: "Administrador" },
  { id: 1, name: "Asistente administrativa" },
  { id: 5, name: "Psicólogo" },
  { id: 2, name: "Marketing y diseño" },
];

export const mockUsers: User[] = [
  {
    id: 1,
    fullName: "Elena Navarro",
    identityDocument: "1000000001",
    email: "elena.navarro@ejemplo.com",
    phone: "3000000001",
    roles: [{ id: 4, name: "Administrador", active: true }],
    status: "active",
    lastLoginAt: "Hace 2 horas",
  },
  {
    id: 2,
    fullName: "Miguel Castillo",
    identityDocument: "1000000002",
    email: "m.castillo@ejemplo.com",
    phone: "3000000002",
    roles: [
      { id: 5, name: "Psicólogo", active: true },
      { id: 2, name: "Marketing y diseño", active: true },
    ],
    status: "active",
    lastLoginAt: "Ayer, 14:30",
  },
  {
    id: 3,
    fullName: "Carlos Mendoza",
    identityDocument: "1000000003",
    email: "recepcion@ejemplo.com",
    phone: "3000000003",
    roles: [{ id: 1, name: "Asistente administrativa", active: true }],
    status: "blocked",
    lastLoginAt: "Hace 5 días",
  },
  {
    id: 4,
    fullName: "Valeria Rojas",
    identityDocument: "1000000004",
    email: "v.rojas@ejemplo.com",
    phone: "3000000004",
    roles: [{ id: 2, name: "Marketing y diseño", active: false }],
    status: "inactive",
    lastLoginAt: "Hace 1 mes",
  },
];