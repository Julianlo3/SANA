"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/types/api-types";
import { listMyAppointments } from "../services/my-appointments-service";
import type {
  MyAppointment,
  MyAppointmentState,
} from "../types/my-appointments-types";

/** Carga las citas del psicólogo y recarga al cambiar el filtro de estado. */
export function useMyAppointments() {
  const [filter, setFilter] = useState<MyAppointmentState>("confirmada");
  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    listMyAppointments(filter, controller.signal)
      .then((result) =>
        setAppointments(
          [...result].sort((a, b) =>
            (a.appDate ?? "").localeCompare(b.appDate ?? ""),
          ),
        ),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar tus citas. Intenta de nuevo.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [filter]);

  const changeFilter = useCallback(
    (next: MyAppointmentState) => {
      if (next === filter) return;
      setFilter(next);
      setIsLoading(true);
      setLoadError(null);
    },
    [filter],
  );

  return { filter, changeFilter, appointments, isLoading, loadError };
}