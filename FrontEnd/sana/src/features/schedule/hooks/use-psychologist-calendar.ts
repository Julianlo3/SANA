"use client";

import { useEffect, useState } from "react";
import { getPsychologistCalendar } from "../services/psychologist-calendar-service";
import type { PsychologistCalendar } from "../types/psychologist-calendar-types";

/**
 * Defines the loaded type.
 */
type Loaded = {
  psychologistId: number;
  calendar: PsychologistCalendar | null;
  error: string | null;
};

/**
 * Loads the selected psychologist's calendar and associates it with that
 * psychologist's ID to prevent stale data after selection changes.
 * @param psychologistId Resource identifier.
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

  return {
    calendar: current?.calendar ?? null,
    isLoading: psychologistId !== null && current === null,
    error: current?.error ?? null,
  };
}