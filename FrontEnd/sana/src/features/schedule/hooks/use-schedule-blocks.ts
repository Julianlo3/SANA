"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createMyBlock,
  createMyRecurringBlock,
  deleteMyBlock,
  deleteMyRecurringBlock,
  getMyBlocks,
  getMyRecurringBlocks,
} from "../services/schedule-service";
import type {
  CreateRecurringScheduleBlockPayload,
  CreateScheduleBlockPayload,
  RecurringScheduleBlock,
  ScheduleBlock,
} from "../types/schedule-types";

/**
 * Lógica de la pantalla de agenda: lista los dos tipos de bloqueo y permite
 * crear/borrar.
 *
 * La carga inicial vive directo dentro del useEffect (patrón isMounted),
 * en vez de llamar a una función compartida: la regla de lint
 * react-hooks/set-state-in-effect no permite que un efecto invoque ninguna
 * función que internamente haga setState, ni siquiera asíncrona. reload()
 * sí es una función aparte, pero solo se usa desde manejadores de eventos
 * (addBlock, removeBlock, etc.), nunca desde un efecto.
 */
export function useScheduleBlocks() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [recurringBlocks, setRecurringBlocks] = useState<RecurringScheduleBlock[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getMyBlocks(), getMyRecurringBlocks()])
      .then(([blocksResult, recurringResult]) => {
        if (!isMounted) return;
        setBlocks(blocksResult);
        setRecurringBlocks(recurringResult);
      })
      .catch(() => {
        if (isMounted) {
          setError("No pudimos cargar tu agenda. Intenta de nuevo.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [blocksResult, recurringResult] = await Promise.all([
        getMyBlocks(),
        getMyRecurringBlocks(),
      ]);
      setBlocks(blocksResult);
      setRecurringBlocks(recurringResult);
    } catch {
      setError("No pudimos cargar tu agenda. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBlock = useCallback(
    async (payload: CreateScheduleBlockPayload) => {
      setIsSaving(true);
      setError(null);
      try {
        await createMyBlock(payload);
        await reload();
        return true;
      } catch {
        setError(
          "No pudimos crear el bloqueo. Revisa que no se cruce con otro.",
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [reload],
  );

  const removeBlock = useCallback(
    async (id: number) => {
      setIsSaving(true);
      setError(null);
      try {
        await deleteMyBlock(id);
        await reload();
      } catch {
        setError("No pudimos borrar el bloqueo.");
      } finally {
        setIsSaving(false);
      }
    },
    [reload],
  );

  const addRecurringBlock = useCallback(
    async (payload: CreateRecurringScheduleBlockPayload) => {
      setIsSaving(true);
      setError(null);
      try {
        await createMyRecurringBlock(payload);
        await reload();
        return true;
      } catch {
        setError(
          "No pudimos crear la regla recurrente. Revisa que no se cruce con otra.",
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [reload],
  );

  const removeRecurringBlock = useCallback(
    async (id: number) => {
      setIsSaving(true);
      setError(null);
      try {
        await deleteMyRecurringBlock(id);
        await reload();
      } catch {
        setError("No pudimos borrar la regla recurrente.");
      } finally {
        setIsSaving(false);
      }
    },
    [reload],
  );

  return {
    blocks,
    recurringBlocks,
    isLoading,
    isSaving,
    error,
    addBlock,
    removeBlock,
    addRecurringBlock,
    removeRecurringBlock,
  };
}