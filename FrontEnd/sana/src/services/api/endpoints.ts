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
} as const;