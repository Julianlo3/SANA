"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/types/api-types";
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
 * Hook to manage schedule blocks and recurring schedule blocks for a user.
 * @returns An object containing the current blocks, recurring blocks, loading and saving states, error messages, and functions to add or remove blocks.
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
      } catch (error: unknown) {
        setError(
          error instanceof ApiError
            ? error.message
            : "No pudimos borrar el bloque. Intenta de nuevo.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [reload],
  );

  // Agrega un bloque recurrente y recarga la lista de bloques.
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

  // Borra un bloque recurrente y recarga la lista de bloques.
  const removeRecurringBlock = useCallback(
    async (id: number) => {
      setIsSaving(true);
      setError(null);
      try {
        await deleteMyRecurringBlock(id);
        await reload();
      } catch (error: unknown) {
        setError(
          error instanceof ApiError
            ? error.message
            : "No pudimos borrar la regla recurrente. Intenta de nuevo.",
        );
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