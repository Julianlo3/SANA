/**
 * Rutas de la API en un solo lugar.
 * Siguen el estándar: inglés, minúsculas, plural y kebab-case.
 */

export const ENDPOINTS = {
  users: "/users",
  user: (id: number) => `/users/${id}`,
  userStatus: (id: number) => `/users/${id}/status`,
  roles: "/roles",

  // Solicitudes de consulta (épica 2) — endpoint público real del backend
  consultationRequests: "/appointments/request",
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

  // Bandeja de la asistente (HU-2.3), contra el backend real (módulo appointments)
  appointments: "/appointments",
  appointment: (id: number) => `/appointments/${id}`,
  appointmentPsychologists: "/appointments/psychologists",
  appointmentAssign: (id: number) => `/appointments/${id}/assign`,
  appointmentConfirm: (id: number) => `/appointments/${id}/confirm`,
  appointmentDiscard: (id: number) => `/appointments/${id}/discard`,
  appointmentStatus: (id: number) => `/appointments/${id}/status`,
  scheduleAvailability: "/schedule/availability",
} as const;