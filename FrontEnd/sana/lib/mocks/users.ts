export type UserStatus = "active" | "inactive" | "blocked";

export type User = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: UserStatus;
  lastLoginAt: string;
};

export const mockUsers: User[] = [
  {
    id: 1,
    fullName: "Elena Navarro",
    email: "elena.navarro@ejemplo.com",
    role: "Administrador",
    status: "active",
    lastLoginAt: "Hace 2 horas",
  },
  {
    id: 2,
    fullName: "Miguel Castillo",
    email: "m.castillo@ejemplo.com",
    role: "Psicólogo",
    status: "active",
    lastLoginAt: "Ayer, 14:30",
  },
  {
    id: 3,
    fullName: "Carlos Mendoza",
    email: "recepcion@ejemplo.com",
    role: "Asistente administrativa",
    status: "blocked",
    lastLoginAt: "Hace 5 días",
  },
  {
    id: 4,
    fullName: "Valeria Rojas",
    email: "v.rojas@ejemplo.com",
    role: "Marketing y diseño",
    status: "inactive",
    lastLoginAt: "Hace 1 mes",
  },
];