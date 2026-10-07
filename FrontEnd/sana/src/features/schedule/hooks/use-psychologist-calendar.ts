"use client";

import { useEffect, useMemo, useState } from "react";
import { calendarToEvents } from "../lib/psychologist-calendar";
import { getPsychologistCalendar } from "../services/psychologist-calendar-service";
import type { CalendarEvent } from "../types/calendar-types";
import type { PsychologistCalendar } from "../types/psychologist-calendar-types";

type Loaded = {
  psychologistId: number;
  calendar: PsychologistCalendar | null;
  error: string | null;
};

/**
 * Carga el calendario del psicólogo elegido. El resultado se guarda junto
 * con el id al que pertenece, así cambiar de psicólogo no muestra datos del
 * anterior y el efecto solo actualiza el estado desde callbacks asíncronos.
 */
export function usePsychologistCalendar(psychologistId: number | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (psychologistId === null) return;

    const controller = new AbortController();

    getPsychologistCalendar(psychologistId, controller.signal)
      .then((calendar) => {
        if (controller.signal.aborted) return;
        setLoaded({ psychologistId, calendar, error: null });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setLoaded({
          psychologistId,
          calendar: null,
          error: "No pudimos cargar el calendario. Intenta de nuevo.",
        });
      });

    return () => controller.abort();
  }, [psychologistId]);

  const current =
    loaded !== null && loaded.psychologistId === psychologistId ? loaded : null;

  const events: CalendarEvent[] = useMemo(
    () => (current?.calendar ? calendarToEvents(current.calendar) : []),
    [current],
  );

  return {
    events,
    isLoading: psychologistId !== null && current === null,
    error: current?.error ?? null,
  };
}