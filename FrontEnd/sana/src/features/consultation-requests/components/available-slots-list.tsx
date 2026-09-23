"use client";

import { CalendarClock } from "lucide-react";
import type { AvailableSlot } from "../types/consultation-request-types";

type Props = {
  slots: AvailableSlot[];
  selectedSlotId: string | null;
  onSelect: (slotId: string | null) => void;
  isLoading: boolean;
};

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const TIME_FORMAT = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
});

/**
 * HU-2.2.10: horarios que los psicólogos dejaron disponibles para la
 * fundación. Nunca se muestran horarios bloqueados ni compromisos externos
 * del profesional — esa distinción la hace el backend, aquí solo se pinta
 * lo que llega.
 */
export default function AvailableSlotsList({
  slots,
  selectedSlotId,
  onSelect,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <p className="rounded-xl border border-border bg-surface-muted px-4 py-6 text-center text-sm text-text-subtle">
        Buscando horarios disponibles…
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-muted px-4 py-6 text-center">
        <p className="text-sm text-text-muted">
          No hay horarios disponibles en este momento.
        </p>
        <p className="mt-1 text-xs text-text-subtle">
          No te preocupes: tu solicitud queda registrada y una asistente te
          confirmará la cita apenas se libere un cupo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {slots.map((slot) => {
        const isSelected = slot.id === selectedSlotId;
        const start = new Date(slot.startsAt);

        return (
          <label
            key={slot.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
              isSelected
                ? "border-primary bg-primary-soft/50"
                : "border-border bg-surface hover:border-primary/40"
            }`}
          >
            <input
              type="radio"
              name="available-slot"
              checked={isSelected}
              onChange={() => onSelect(isSelected ? null : slot.id)}
              className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
            />

            <CalendarClock size={18} className="shrink-0 text-primary" aria-hidden />

            <span className="text-sm text-text">
              <span className="block font-semibold capitalize">
                {DATE_FORMAT.format(start)}
              </span>
              <span className="text-text-muted">
                {TIME_FORMAT.format(start)} · {slot.psychologistName}
              </span>
            </span>
          </label>
        );
      })}

      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`w-full rounded-xl border border-dashed p-3 text-center text-xs font-semibold transition ${
          selectedSlotId === null
            ? "border-primary text-primary"
            : "border-border text-text-subtle hover:border-primary/40"
        }`}
      >
        Ninguno me sirve, prefiero que la asistente me contacte
      </button>
    </div>
  );
}