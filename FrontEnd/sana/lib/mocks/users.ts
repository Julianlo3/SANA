export type UserStatus = "active" | "inactive" | "blocked";

export type User = {
  id: number;
  fullName: string;
  identityDocument: string;
  email: string;
  phone: string;
  role: string;
  status: UserStatus;
  lastLoginAt: string;
};

export const ROLES = [
  { id: 4, name: "Administrador" },
  { id: 1, name: "Asistente administrativa" },
  { id: 5, name: "Psicólogo" },
  { id: 2, name: "Marketing y diseño" },
];

export const mockUsers: User[] = [
  {
    id: 1,
    fullName: "Elena Navarro",
    identityDocument: "1061234567",
    email: "elena.navarro@gmail.com",
    phone: "3001234567",
    role: "Administrador",
    status: "active",
    lastLoginAt: "Hace 2 horas",
  },
  {
    id: 2,
    fullName: "Miguel Castillo",
    identityDocument: "1062345678",
    email: "m.castillo@gmail.com",
    phone: "3012345678",
    role: "Psicólogo",
    status: "active",
    lastLoginAt: "Ayer, 14:30",
  },
  {
    id: 3,
    fullName: "Carlos Mendoza",
    identityDocument: "1063456789",
    email: "recepcion.huellas@gmail.com",
    phone: "3023456789",
    role: "Asistente administrativa",
    status: "blocked",
    lastLoginAt: "Hace 5 días",
  },
  {
    id: 4,
    fullName: "Valeria Rojas",
    identityDocument: "1064567890",
    email: "v.rojas@gmail.com",
    phone: "3034567890",
    role: "Marketing y diseño",
    status: "inactive",
    lastLoginAt: "Hace 1 mes",
  },
];