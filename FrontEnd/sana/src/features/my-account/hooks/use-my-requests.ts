"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/types/api-types";
import {
  cancelMyRequest,
  listMyRequests,
} from "../services/my-account-service";
import type { MyRequest } from "../types/my-account-types";

/** Loads the signed-in user's appointment requests and exposes cancellation actions. */
export function useMyRequests() {
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    listMyRequests(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setRequests(result);
        setLoadError(null);
      })
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
  }, [reloadKey]);

  /** Reloads the request list and displays a success notice. */
  const reload = useCallback((message: string) => {
    setNotice(message);
    setActionError(null);
    setReloadKey((current) => current + 1);
  }, []);

  /** Cancels or withdraws a request, reloads the list, and reports success. */
  const cancel = useCallback(async (request: MyRequest): Promise<boolean> => {
    setCancelingId(request.appId);
    setActionError(null);
    setNotice(null);

    try {
      await cancelMyRequest(request.appId);
      setNotice(
        request.appState === "confirmada"
          ? "Tu cita fue cancelada."
          : "Tu solicitud fue retirada.",
      );
      setReloadKey((current) => current + 1);
      return true;
    } catch (error: unknown) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "No pudimos completar la acción. Intenta de nuevo.",
      );
      return false;
    } finally {
      setCancelingId(null);
    }
  }, []);

  return {
    requests,
    isLoading,
    loadError,
    cancelingId,
    notice,
    actionError,
    cancel,
    reload,
  };
}