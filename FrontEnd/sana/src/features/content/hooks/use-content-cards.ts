"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { refreshPublicContent } from "../actions/refresh-public-content";
import type { CardSectionConfig } from "../config/content-sections";
import {
  createContentCard,
  deleteContentCard,
  getContentCards,
  updateContentCard,
} from "../services/content-service";
import type { ContentCard, ContentCardPayload } from "../types/content-types";
import {
  buildCardValidator,
  type CardFormValues,
} from "../validation/content-validation";

const EMPTY_VALUES: CardFormValues = {
  title: "",
  subtitle: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  isActive: true,
};

type Editor = { mode: "create" } | { mode: "edit"; card: ContentCard } | null;

function toFormValues(card: ContentCard): CardFormValues {
  return {
    title: card.title,
    subtitle: card.subtitle ?? "",
    description: card.description ?? "",
    imageUrl: card.imageUrl ?? "",
    imageAlt: card.imageAlt ?? "",
    isActive: card.isActive,
  };
}

function toPayload(values: CardFormValues): ContentCardPayload {
  const imageUrl = values.imageUrl || null;
  return {
    title: values.title.trim(),
    subtitle: values.subtitle.trim() || null,
    description: values.description.trim() || null,
    imageUrl,
    imageAlt: imageUrl ? values.imageAlt.trim() : null,
    isActive: values.isActive,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useContentCards(config: CardSectionConfig) {
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [cardToDelete, setCardToDelete] = useState<ContentCard | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const validate = useMemo(() => buildCardValidator(config), [config]);
  const initialValues = useMemo(
    () => (editor?.mode === "edit" ? toFormValues(editor.card) : EMPTY_VALUES),
    [editor],
  );
  const form = useForm<CardFormValues>({ initialValues, validate });
  const { reset, submit, changedFields } = form;

  useEffect(() => {
    const controller = new AbortController();

    getContentCards(config.section, controller.signal)
      .then((found) => {
        if (!controller.signal.aborted) setCards(found);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(errorMessage(error, "No pudimos cargar esta sección."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [config.section]);

  const openCreate = useCallback(() => {
    setEditor({ mode: "create" });
    reset(EMPTY_VALUES);
    setActionError(null);
    setNotice(null);
  }, [reset]);

  const openEdit = useCallback(
    (card: ContentCard) => {
      setEditor({ mode: "edit", card });
      reset(toFormValues(card));
      setActionError(null);
      setNotice(null);
    },
    [reset],
  );

  const cancelEdit = useCallback(() => {
    setEditor(null);
    setActionError(null);
  }, []);

  const runWrite = useCallback(
    async (write: () => Promise<void>, successNotice: string, fallback: string) => {
      setIsSaving(true);
      setActionError(null);
      setNotice(null);
      try {
        await write();
        await refreshPublicContent();
        setNotice(successNotice);
        return true;
      } catch (error) {
        setActionError(errorMessage(error, fallback));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const save = useCallback(async () => {
    if (!editor) return;
    const submitted = submit();
    if (!submitted) return;

    if (editor.mode === "edit" && changedFields.length === 0) {
      setEditor(null);
      return;
    }

    const payload = toPayload(submitted);
    const wasSaved = await runWrite(
      async () => {
        if (editor.mode === "create") {
          const created = await createContentCard(config.section, payload);
          setCards((current) => [...current, created]);
          return;
        }
        const changes = Object.fromEntries(
          changedFields.map((field) => [field, payload[field]]),
        ) as Partial<ContentCardPayload>;
        const updated = await updateContentCard(editor.card.id, changes);
        setCards((current) =>
          current.map((card) => (card.id === updated.id ? updated : card)),
        );
      },
      "Los cambios quedaron publicados.",
      "No pudimos guardar los cambios. Intenta de nuevo.",
    );

    if (wasSaved) setEditor(null);
  }, [changedFields, config.section, editor, runWrite, submit]);

  const toggleActive = useCallback(
    (card: ContentCard) =>
      runWrite(
        async () => {
          const updated = await updateContentCard(card.id, {
            isActive: !card.isActive,
          });
          setCards((current) =>
            current.map((item) => (item.id === updated.id ? updated : item)),
          );
        },
        card.isActive
          ? "El elemento ya no se muestra en el sitio."
          : "El elemento ya se muestra en el sitio.",
        "No pudimos cambiar la visibilidad. Intenta de nuevo.",
      ),
    [runWrite],
  );

  const confirmDelete = useCallback(async () => {
    if (!cardToDelete) return;
    const target = cardToDelete;
    const wasDeleted = await runWrite(
      async () => {
        await deleteContentCard(target.id);
        setCards((current) => current.filter((card) => card.id !== target.id));
      },
      "El elemento fue eliminado.",
      "No pudimos eliminar el elemento. Intenta de nuevo.",
    );
    if (wasDeleted) setCardToDelete(null);
  }, [cardToDelete, runWrite]);

  return {
    ...form,
    cards,
    isLoading,
    loadError,
    editor,
    isSaving,
    isUploading,
    setIsUploading,
    actionError,
    notice,
    cardToDelete,
    openCreate,
    openEdit,
    cancelEdit,
    save,
    toggleActive,
    requestDelete: setCardToDelete,
    cancelDelete: () => setCardToDelete(null),
    confirmDelete,
  };
}
