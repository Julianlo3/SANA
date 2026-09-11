export type AccessRequest = {
  id: string;
  fullName: string;
  email: string;
  requestedAt: string;
  emailVerified: boolean;
};

export type Role = {
  id: number;
  name: string;
};

export const mockAccessRequests: AccessRequest[] = [
  {
    id: "REQ-00142",
    fullName: "Laura Martínez Gómez",
    email: "laura.martinez@ejemplo.com",
    requestedAt: "24 oct 2026 · 10:45",
    emailVerified: true,
  },
  {
    id: "REQ-00141",
    fullName: "Carlos Arturo Vega",
    email: "carlos.vega@ejemplo.com",
    requestedAt: "23 oct 2026 · 14:15",
    emailVerified: true,
  },
  {
    id: "REQ-00140",
    fullName: "Elena Ramírez Soto",
    email: "elena.rs@ejemplo.com",
    requestedAt: "22 oct 2026 · 09:30",
    emailVerified: false,
  },
];

export const ROLES: Role[] = [
  { id: 4, name: "Administrador" },
  { id: 1, name: "Asistente administrativa" },
  { id: 5, name: "Psicólogo" },
  { id: 2, name: "Marketing y diseño" },
];