/**
 * Rutas de la API en un solo lugar.
 * Siguen el estándar: inglés, minúsculas, plural y kebab-case.
 */

export const ENDPOINTS = {
  users: "/users",
  user: (id: number) => `/users/${id}`,
  userStatus: (id: number) => `/users/${id}/status`,
  roles: "/roles",
} as const;