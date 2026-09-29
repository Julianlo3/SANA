import type {
  AvailabilityBlock,
  DayShift,
  ShiftMode,
  WeekDay,
  WeeklyAvailability,
} from "../types/availability-block-types";

/**
 * Servicio de disponibilidad del psicólogo — MOCK.
 *
 * No existe backend todavía para esto (confirmado revisando el repositorio
 * el 29/09: no hay ningún endpoint ni commit relacionado a bloques de
 * disponibilidad). Este archivo guarda el estado en memoria mientras se
 * espera la confirmación del equipo sobre el contrato real.
 *
 * Cuando el backend exista, solo hay que reemplazar el cuerpo de estas
 * tres funciones por llamadas a httpClient — el resto de la pantalla no
 * debería cambiar, porque ya usa esta forma (WeeklyAvailability).
 */

const WEEK_DAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 7];
const SHIFTS: DayShift[] = ["morning", "afternoon"];

function buildEmptyGrid(psychologistId: number): WeeklyAvailability {
  const blocks: AvailabilityBlock[] = [];

  for (const dayOfWeek of WEEK_DAYS) {
    for (const shift of SHIFTS) {
      blocks.push({ dayOfWeek, shift, isAvailable: false, mode: null });
    }
  }

  return { psychologistId, blocks };
}

/** Una copia en memoria por psicólogo, para que sobreviva mientras dura la sesión del navegador. */
const mockStore = new Map<number, WeeklyAvailability>();

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 300));
}

/** Trae la grilla semanal de un psicólogo. Si no tiene nada guardado, devuelve todo vacío. */
export async function getWeeklyAvailability(
  psychologistId: number,
): Promise<WeeklyAvailability> {
  const existing = mockStore.get(psychologistId);
  return delay(existing ?? buildEmptyGrid(psychologistId));
}

/**
 * Marca o desmarca una celda (día + turno). Si se pasa mode = null, la
 * celda queda como no disponible.
 */
export async function setAvailabilityBlock(
  psychologistId: number,
  dayOfWeek: WeekDay,
  shift: DayShift,
  mode: ShiftMode | null,
): Promise<WeeklyAvailability> {
  const current = mockStore.get(psychologistId) ?? buildEmptyGrid(psychologistId);

  const updatedBlocks = current.blocks.map((block) =>
    block.dayOfWeek === dayOfWeek && block.shift === shift
      ? { ...block, isAvailable: mode !== null, mode }
      : block,
  );

  const updated: WeeklyAvailability = { psychologistId, blocks: updatedBlocks };
  mockStore.set(psychologistId, updated);

  return delay(updated);
}