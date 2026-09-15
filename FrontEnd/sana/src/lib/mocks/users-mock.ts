import type { User } from "@/features/users/types/user-types";

/**
 * Datos de prueba mientras el backend no expone /users.
 * Solo los consume users-service.
 */
export const USERS_MOCK: User[] = [
  {
    id: 1,
    fullName: "Elena Navarro",
    identityDocument: "1061234567",
    email: "elena.navarro@gmail.com",
    contactNumber: "3001234567",
    roles: [{ id: 4, isActive: true }],
    status: "active",
    lastLoginAt: "2026-09-12T09:30:00Z",
  },
  {
    id: 2,
    fullName: "Miguel Castillo",
    identityDocument: "1062345678",
    email: "miguel.castillo@gmail.com",
    contactNumber: "3012345678",
    roles: [
      { id: 5, isActive: true },
      { id: 2, isActive: false },
    ],
    status: "active",
    lastLoginAt: "2026-09-11T15:10:00Z",
    professionalData: {
      licenseNumber: "884512",
      speciality: "Psicología infantil",
    },
  },
  {
    id: 3,
    fullName: "Carolina Ospina",
    identityDocument: "1063456789",
    email: "carolina.ospina@gmail.com",
    contactNumber: "3023456789",
    roles: [{ id: 1, isActive: true }],
    status: "inactive",
    lastLoginAt: "2026-08-28T12:00:00Z",
  },
  {
    id: 4,
    fullName: "Andrés Quintero",
    identityDocument: "1064567890",
    email: "andres.quintero@gmail.com",
    contactNumber: "3034567890",
    roles: [{ id: 2, isActive: true }],
    status: "blocked",
    lastLoginAt: "2026-07-19T18:45:00Z",
  },
  {
    id: 5,
    fullName: "Valentina Ruiz",
    identityDocument: "1065678901",
    email: "valentina.ruiz@gmail.com",
    contactNumber: "3045678901",
    roles: [
      { id: 5, isActive: true },
      { id: 1, isActive: true },
    ],
    status: "active",
    lastLoginAt: null,
    professionalData: {
      licenseNumber: "771203",
      speciality: "Terapia familiar",
    },
  },
];