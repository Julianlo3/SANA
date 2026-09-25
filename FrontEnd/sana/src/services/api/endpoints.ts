/**
 * Rutas de la API en un solo lugar.
 * Siguen el estándar: inglés, minúsculas, plural y kebab-case.
 */

export const ENDPOINTS = {
  users: "/users",
  user: (id: number) => `/users/${id}`,
  userStatus: (id: number) => `/users/${id}/status`,
  roles: "/roles",
    // Solicitudes de consulta (épica 2)
  consultationRequests: "/consultation-requests",
  consultationRequest: (id: number) => `/consultation-requests/${id}`,
  residenceZones: "/residence-zones",
   availableSlots: "/consultation-requests/available-slots",
     // Consultantes (HU-2.1 y HU-2.4)
  consultants: "/consultants",
  consultantSummary: (id: number) => `/consultants/${id}`,
  consultantFullRecord: (id: number) => `/consultants/${id}/full`,
  consultantsForPsychologist: "/consultants/mine",
  consultantAccessLog: (id: number) => `/consultants/${id}/access-log`,
    // Registro de atención (HU-2.5)
  psychologistAppointments: "/appointments/mine",
  careRecords: "/care-records",
} as const;