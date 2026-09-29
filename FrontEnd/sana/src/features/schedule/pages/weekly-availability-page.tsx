"use client";

import { useWeeklyAvailability } from "../hooks/use-weekly-availability";
import type {
  AvailabilityBlock,
  DayShift,
  ShiftMode,
  WeekDay,
} from "../types/availability-block-types";

type Props = {
  psychologistId: number;
};

const DAY_LABELS: Record<WeekDay, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

const SHIFT_LABELS: Record<DayShift, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
};

const WEEK_DAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 7];
const SHIFTS: DayShift[] = ["morning", "afternoon"];

/** El ciclo al hacer clic: no disponible -> presencial -> virtual -> no disponible. */
function nextMode(current: ShiftMode | null): ShiftMode | null {
  if (current === null) return "presencial";
  if (current === "presencial") return "virtual";
  return null;
}

function cellLabel(mode: ShiftMode | null): string {
  if (mode === "presencial") return "Presencial";
  if (mode === "virtual") return "Virtual";
  return "";
}

function cellClass(mode: ShiftMode | null): string {
  if (mode === "presencial") {
    return "bg-primary text-white border-primary";
  }
  if (mode === "virtual") {
    return "bg-accent-soft text-accent-strong border-accent-soft";
  }
  return "bg-surface text-text-subtle border-border hover:border-primary/40";
}

/**
 * Pantalla donde el psicólogo marca su disponibilidad semanal, por
 * bloques de mañana/tarde (decisión del daily del 29/09).
 *
 * MOCK: no hay backend todavía. Ver comentario en availability-service.ts.
 */
export default function WeeklyAvailabilityPage({ psychologistId }: Props) {
  const { availability, isLoading, isSaving, toggleBlock } =
    useWeeklyAvailability(psychologistId);

  function findBlock(dayOfWeek: WeekDay, shift: DayShift): AvailabilityBlock | undefined {
    return availability?.blocks.find(
      (block) => block.dayOfWeek === dayOfWeek && block.shift === shift,
    );
  }

  function handleClick(dayOfWeek: WeekDay, shift: DayShift) {
    const block = findBlock(dayOfWeek, shift);
    toggleBlock(dayOfWeek, shift, nextMode(block?.mode ?? null));
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-text-subtle">Cargando tu disponibilidad…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-primary-dark">
        Mi disponibilidad
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Marca los bloques en los que puedes atender. Un clic para
        presencial, otro para virtual, otro para quitarlo.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-2">
          <thead>
            <tr>
              <th className="w-24 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
                Turno
              </th>
              {WEEK_DAYS.map((day) => (
                <th
                  key={day}
                  className="text-center text-xs font-semibold uppercase tracking-wider text-text-subtle"
                >
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFTS.map((shift) => (
              <tr key={shift}>
                <td className="text-sm font-semibold text-text">
                  {SHIFT_LABELS[shift]}
                </td>
                {WEEK_DAYS.map((day) => {
                  const block = findBlock(day, shift);

                  return (
                    <td key={day}>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleClick(day, shift)}
                        className={`h-16 w-full cursor-pointer rounded-xl border text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${cellClass(block?.mode ?? null)}`}
                      >
                        {cellLabel(block?.mode ?? null)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-text-subtle">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-primary" /> Presencial
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-accent-soft" /> Virtual
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-border bg-surface" />{" "}
          No disponible
        </span>
      </div>
    </div>
  );
}