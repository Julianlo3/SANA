"use client";

import { useRef, useState } from "react";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import { ApiError } from "@/types/api-types";
import {
  colombiaToday,
  formatCalendarDate,
  formatSlotTime,
} from "../lib/appointment-format";
import {
  buildSlotDateTime,
  findAvailability,
} from "../services/appointments-service";
import type { AvailabilitySlot } from "../types/appointment-types";

/** Franja y psicólogo elegidos, junto con la duración con la que se buscó. */
export type SlotSelection = {
  slot: AvailabilitySlot;
  psychologistId: number;
  /** Asignar debe usar la misma duración con la que se buscó. */
  duration: number;
};

type Props = {
  /** Día inicial de la búsqueda (AAAA-MM-DD), normalmente el que prefirió la persona. */
  defaultDate: string;
  selection: SlotSelection | null;
  onSelect: (selection: SlotSelection | null) => void;
  disabled?: boolean;
};

const DURATIONS = [30, 45, 60, 90];

/**
 * HU-2.3.3 y 2.3.4: busca horarios libres y deja elegir franja y psicólogo.
 * Si la búsqueda no devuelve nada, se avisa: no se puede asignar sin cupo.
 */
export default function SlotPicker({
  defaultDate,
  selection,
  onSelect,
  disabled = false,
}: Props) {
  const [date, setDate] = useState(defaultDate);
  const [duration, setDuration] = useState(60);
  const [slots, setSlots] = useState<AvailabilitySlot[] | null>(null);
  const [searchedDuration, setSearchedDuration] = useState(60);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  function clearResults() {
    controllerRef.current?.abort();
    setIsSearching(false);
    setSlots(null);
    setError(null);
    onSelect(null);
  }

  function changeDate(value: string) {
    setDate(value);
    clearResults();
  }

  function changeDuration(value: number) {
    setDuration(value);
    clearResults();
  }

  async function search() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsSearching(true);
    setError(null);
    onSelect(null);

    // Si se busca en el día de hoy, se parte de ahora para no ofrecer horas pasadas.
    const appointmentStart =
      date === colombiaToday()
        ? new Date().toISOString()
        : buildSlotDateTime(date, "00:00");

    try {
      const result = await findAvailability(
        { appointmentStart, duration, delayHours: 24 },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setSlots(result);
      setSearchedDuration(duration);
    } catch (caught: unknown) {
      if (controller.signal.aborted) return;
      setSlots(null);
      setError(
        caught instanceof ApiError
          ? caught.message
          : "No pudimos buscar los horarios. Intenta de nuevo.",
      );
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  }

  function isSelected(slot: AvailabilitySlot, psychologistId: number): boolean {
    return (
      selection !== null &&
      selection.psychologistId === psychologistId &&
      selection.slot.date === slot.date &&
      selection.slot.startTime === slot.startTime
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="text-sm font-medium text-text">
            Buscar desde el día
          </span>
          <input
            type="date"
            value={date}
            min={colombiaToday()}
            disabled={disabled}
            onChange={(event) => changeDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-surface-muted"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-text">
            Duración de la cita
          </span>
          <select
            value={duration}
            disabled={disabled}
            onChange={(event) => changeDuration(Number(event.target.value))}
            className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-surface-muted"
          >
            {DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutos
              </option>
            ))}
          </select>
        </label>

        <Button onClick={search} disabled={disabled || isSearching || !date}>
          {isSearching ? "Buscando…" : "Buscar horarios"}
        </Button>
      </div>

      {error && <InlineMessage tone="error">{error}</InlineMessage>}

      {slots !== null && slots.length === 0 && (
        <p className="rounded-xl border border-border bg-surface-muted px-4 py-6 text-center text-sm text-text-muted">
          No hay horarios libres en esa ventana. Prueba con otro día u otra
          duración.
        </p>
      )}

      {slots !== null && slots.length > 0 && (
        <div className="space-y-3">
          {slots.map((slot) => (
            <div
              key={`${slot.date}|${slot.startTime}`}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <p className="text-sm font-semibold text-text">
                {formatSlotTime(slot.startTime)} –{" "}
                {formatSlotTime(slot.endTime)}
                <span className="ml-2 font-normal text-text-muted">
                  {formatCalendarDate(slot.date)}
                </span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {slot.psychologists.map((psychologist) => {
                  const selected = isSelected(slot, psychologist.id);

                  return (
                    <button
                      key={psychologist.id}
                      type="button"
                      disabled={disabled}
                      aria-pressed={selected}
                      onClick={() =>
                        onSelect({
                          slot,
                          psychologistId: psychologist.id,
                          duration: searchedDuration,
                        })
                      }
                      className={`cursor-pointer rounded-full border px-4 py-1.5 text-left text-xs transition disabled:cursor-not-allowed ${
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
                      }`}
                    >
                      <span className="font-semibold">{psychologist.name}</span>
                      {psychologist.speciality && (
                        <span className="ml-1 opacity-80">
                          · {psychologist.speciality}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}