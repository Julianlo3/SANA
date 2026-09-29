/**
 * Tipos para la disponibilidad del psicólogo (agenda por bloques).
 *
 * Decisión de equipo (daily 29/09): el psicólogo marca su disponibilidad
 * por bloques de mañana/tarde en una grilla semanal. La asistente ve esos
 * mismos bloques con más detalle (franjas horarias finas) para asignar
 * citas puntuales dentro de un bloque marcado como disponible.
 *
 * PENDIENTE DE CONFIRMAR CON BACKEND (sin respuesta aún):
 * - Si esto reemplaza el sistema de bloqueos que ya existe
 *   (BackEnd/backendsana/src/schedule/...) o se construye encima.
 * - Los endpoints reales (no existen todavía del lado del backend).
 * - Las horas exactas de cada bloque (mañana/tarde).
 * - Si esto reemplaza el flujo de disponibilidad que ya usa la bandeja
 *   (GET /schedule/availability, ver features/appointments).
 *
 * Mientras no haya respuesta, este archivo define solo el contrato que el
 * frontend necesita para poder empezar a construir la pantalla, sin
 * asumir nombres reales del backend.
 */

/** Un día de la semana, en el mismo formato ISO que usa PostgreSQL (1 = lunes, 7 = domingo). */
export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Los dos bloques del día. Las horas exactas de cada uno están pendientes de confirmar. */
export type DayShift = "morning" | "afternoon";

/** Si el psicólogo puede atender presencial, virtual, o ambas, en ese bloque. */
export type ShiftMode = "presencial" | "virtual" | "ambas";

/**
 * Una celda de la grilla semanal: un bloque (mañana/tarde) de un día
 * concreto, con lo que el psicólogo marcó para esa celda.
 */
export type AvailabilityBlock = {
  dayOfWeek: WeekDay;
  shift: DayShift;
  /** Si el psicólogo marcó esta celda como disponible para atender. */
  isAvailable: boolean;
  /** Solo tiene sentido si isAvailable es true. */
  mode: ShiftMode | null;
};

/** La grilla completa de un psicólogo: sus 14 celdas (7 días × 2 bloques). */
export type WeeklyAvailability = {
  psychologistId: number;
  blocks: AvailabilityBlock[];
};

/**
 * Lo que la asistente ve al mirar un bloque marcado como disponible:
 * las franjas horarias finas dentro de ese bloque, para elegir una
 * puntual al asignar una cita. Igual de forma a AvailabilitySlot
 * (features/appointments/types/appointment-types.ts) — si al final es el
 * mismo backend el que arma esto, se puede unificar.
 */
export type FineGrainedSlot = {
  startTime: string;
  endTime: string;
  isTaken: boolean;
};