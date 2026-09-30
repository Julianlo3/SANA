"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { refreshPublicContent } from "../actions/refresh-public-content";
import { getContentItems, saveContentItems } from "../services/content-service";
import type { ContentItem, ContentItemKey } from "../types/content-types";
import {
  validateMissionVision,
  type MissionVisionValues,
} from "../validation/content-validation";

const FIELD_KEYS: Record<keyof MissionVisionValues, ContentItemKey> = {
  mission: "about.mission",
  vision: "about.vision",
};

function toFormValues(items: ContentItem[]): MissionVisionValues {
  const valueOf = (key: ContentItemKey) =>
    items.find((item) => item.key === key)?.value ?? "";
  return {
    mission: valueOf(FIELD_KEYS.mission),
    vision: valueOf(FIELD_KEYS.vision),
  };
}

function findLastEdit(items: ContentItem[]) {
  return items
    .filter((item) => item.updatedAt && item.updatedBy)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))[0];
}

export function useMissionVisionForm() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wasSaved, setWasSaved] = useState(false);

  const initialValues = useMemo(() => toFormValues(items), [items]);
  const form = useForm<MissionVisionValues>({
    initialValues,
    validate: validateMissionVision,
  });
  const { reset, submit, changedFields } = form;

  useEffect(() => {
    const controller = new AbortController();

    getContentItems(controller.signal)
      .then((found) => {
        if (controller.signal.aborted) return;
        setItems(found);
        reset(toFormValues(found));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar la misión y la visión.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [reset]);

  const save = useCallback(async () => {
    setWasSaved(false);
    const submitted = submit();
    if (!submitted) return;
    if (changedFields.length === 0) return;

    setIsSaving(true);
    setSubmitError(null);

    try {
      const saved = await saveContentItems(
        changedFields.map((field) => ({
          key: FIELD_KEYS[field],
          value: submitted[field].trim(),
        })),
      );
      await refreshPublicContent();
      setItems(saved);
      reset(toFormValues(saved));
      setWasSaved(true);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No pudimos guardar los cambios. Intenta de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [changedFields, reset, submit]);

  const cancel = useCallback(() => {
    reset(initialValues);
    setSubmitError(null);
    setWasSaved(false);
  }, [initialValues, reset]);

  return {
    ...form,
    lastEdit: findLastEdit(items),
    isLoading,
    loadError,
    isSaving,
    submitError,
    wasSaved,
    save,
    cancel,
  };
}
