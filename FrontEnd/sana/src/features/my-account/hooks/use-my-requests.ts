"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/types/api-types";
import { listMyRequests } from "../services/my-account-service";
import type { MyRequest } from "../types/my-account-types";

/** Carga las solicitudes de cita de la persona que inició sesión. */
export function useMyRequests() {
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    listMyRequests(controller.signal)
      .then((result) => setRequests(result))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar tus solicitudes. Intenta de nuevo.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { requests, isLoading, loadError };
}