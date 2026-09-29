"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { refreshPublicContent } from "../actions/refresh-public-content";
import { PUBLIC_NEWS_TAG } from "../config/content-access";
import {
  createNews,
  getNews,
  updateNews,
  updateNewsPin,
  updateNewsStatus,
} from "../services/news-service";
import type { News, NewsPayload } from "../types/content-types";

export type NewsFormValues = {
  title: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
};

const EMPTY_VALUES: NewsFormValues = { title: "", body: "", imageUrl: "", imageAlt: "" };

type Editor = { mode: "create" } | { mode: "edit"; news: News } | null;

function toFormValues(news: News): NewsFormValues {
  return {
    title: news.title,
    body: news.body,
    imageUrl: news.imageUrl ?? "",
    imageAlt: news.imageAlt ?? "",
  };
}

function toPayload(values: NewsFormValues): NewsPayload {
  const imageUrl = values.imageUrl || null;
  return {
    title: values.title.trim(),
    body: values.body.trim(),
    imageUrl,
    imageAlt: imageUrl ? values.imageAlt.trim() : null,
  };
}

function validate(values: NewsFormValues): Partial<Record<keyof NewsFormValues, string>> {
  const errors: Partial<Record<keyof NewsFormValues, string>> = {};
  if (!values.title.trim()) errors.title = "Escribe el título.";
  if (!values.body.trim()) errors.body = "Escribe el contenido.";
  if (values.imageUrl && !values.imageAlt.trim()) {
    errors.imageAlt = "Describe la imagen.";
  }
  return errors;
}

function sortNews(items: News[]): News[] {
  return [...items].sort(
    (a, b) =>
      Number(b.isPinned) - Number(a.isPinned) ||
      b.publishedAt.localeCompare(a.publishedAt) ||
      b.id - a.id,
  );
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useNewsManagement() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const initialValues = useMemo(
    () => (editor?.mode === "edit" ? toFormValues(editor.news) : EMPTY_VALUES),
    [editor],
  );
  const form = useForm<NewsFormValues>({ initialValues, validate });
  const { reset, submit, changedFields } = form;

  useEffect(() => {
    const controller = new AbortController();

    getNews(controller.signal)
      .then((found) => {
        if (!controller.signal.aborted) setNews(sortNews(found));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(errorMessage(error, "No pudimos cargar las noticias."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const replaceNews = useCallback((updated: News) => {
    setNews((current) =>
      sortNews(current.map((item) => (item.id === updated.id ? updated : item))),
    );
  }, []);

  const runWrite = useCallback(
    async (write: () => Promise<void>, successNotice: string, fallback: string) => {
      setIsSaving(true);
      setActionError(null);
      setNotice(null);
      try {
        await write();
        await refreshPublicContent(PUBLIC_NEWS_TAG);
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

  const openCreate = useCallback(() => {
    setEditor({ mode: "create" });
    reset(EMPTY_VALUES);
    setActionError(null);
    setNotice(null);
  }, [reset]);

  const openEdit = useCallback(
    (item: News) => {
      setEditor({ mode: "edit", news: item });
      reset(toFormValues(item));
      setActionError(null);
      setNotice(null);
    },
    [reset],
  );

  const cancelEdit = useCallback(() => {
    setEditor(null);
    setActionError(null);
  }, []);

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
          const created = await createNews(payload);
          setNews((current) => sortNews([created, ...current]));
          return;
        }
        const changes: Partial<NewsPayload> = {};
        if (changedFields.includes("title")) changes.title = payload.title;
        if (changedFields.includes("body")) changes.body = payload.body;
        if (changedFields.includes("imageUrl") || changedFields.includes("imageAlt")) {
          changes.imageUrl = payload.imageUrl;
          changes.imageAlt = payload.imageAlt;
        }
        replaceNews(await updateNews(editor.news.id, changes));
      },
      editor.mode === "create"
        ? "La noticia quedó publicada en el sitio."
        : "Los cambios quedaron publicados.",
      "No pudimos guardar la noticia. Intenta de nuevo.",
    );

    if (wasSaved) setEditor(null);
  }, [changedFields, editor, replaceNews, runWrite, submit]);

  const toggleStatus = useCallback(
    (item: News) => {
      const isRetiring = item.status === "published";
      return runWrite(
        async () => {
          replaceNews(await updateNewsStatus(item.id, isRetiring ? "retired" : "published"));
        },
        isRetiring
          ? "La noticia se retiró del sitio. Sigue guardada en este listado."
          : "La noticia volvió a publicarse.",
        "No pudimos cambiar el estado de la noticia. Intenta de nuevo.",
      );
    },
    [replaceNews, runWrite],
  );

  const togglePin = useCallback(
    (item: News) =>
      runWrite(
        async () => {
          const updated = await updateNewsPin(item.id, !item.isPinned);
          setNews((current) =>
            sortNews(
              current.map((entry) => {
                if (entry.id === updated.id) return updated;
                return updated.isPinned ? { ...entry, isPinned: false } : entry;
              }),
            ),
          );
        },
        item.isPinned
          ? "La noticia ya no está fijada."
          : "La noticia quedó fijada al inicio del listado.",
        "No pudimos fijar la noticia. Intenta de nuevo.",
      ),
    [runWrite],
  );

  return {
    ...form,
    news,
    isLoading,
    loadError,
    editor,
    isSaving,
    isUploading,
    setIsUploading,
    actionError,
    notice,
    openCreate,
    openEdit,
    cancelEdit,
    save,
    toggleStatus,
    togglePin,
  };
}
