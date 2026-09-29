"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { refreshPublicContent } from "../actions/refresh-public-content";
import { PUBLIC_GALLERY_TAG } from "../config/content-access";
import {
  createGalleryImage,
  getGalleryImages,
  updateGalleryImage,
  updateGalleryImageStatus,
} from "../services/gallery-service";
import type { GalleryImage } from "../types/content-types";

export type GalleryFormValues = {
  imageUrl: string;
  imageAlt: string;
  caption: string;
};

const EMPTY_VALUES: GalleryFormValues = { imageUrl: "", imageAlt: "", caption: "" };

type Editor = { mode: "create" } | { mode: "edit"; image: GalleryImage } | null;

function validate(values: GalleryFormValues): Partial<Record<keyof GalleryFormValues, string>> {
  const errors: Partial<Record<keyof GalleryFormValues, string>> = {};
  if (!values.imageUrl) errors.imageUrl = "Sube una imagen.";
  if (!values.imageAlt.trim()) errors.imageAlt = "Describe la imagen.";
  return errors;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useGalleryManagement() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const initialValues = useMemo<GalleryFormValues>(
    () =>
      editor?.mode === "edit"
        ? {
            imageUrl: editor.image.imageUrl,
            imageAlt: editor.image.imageAlt,
            caption: editor.image.caption ?? "",
          }
        : EMPTY_VALUES,
    [editor],
  );
  const form = useForm<GalleryFormValues>({ initialValues, validate });
  const { reset, submit, changedFields } = form;

  useEffect(() => {
    const controller = new AbortController();

    getGalleryImages(controller.signal)
      .then((found) => {
        if (!controller.signal.aborted) setImages(found);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(errorMessage(error, "No pudimos cargar la galería."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const replaceImage = useCallback((updated: GalleryImage) => {
    setImages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  const runWrite = useCallback(
    async (write: () => Promise<void>, successNotice: string, fallback: string) => {
      setIsSaving(true);
      setActionError(null);
      setNotice(null);
      try {
        await write();
        await refreshPublicContent(PUBLIC_GALLERY_TAG);
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
    (image: GalleryImage) => {
      setEditor({ mode: "edit", image });
      reset({
        imageUrl: image.imageUrl,
        imageAlt: image.imageAlt,
        caption: image.caption ?? "",
      });
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

    const caption = submitted.caption.trim() || null;
    const wasSaved = await runWrite(
      async () => {
        if (editor.mode === "create") {
          const created = await createGalleryImage({
            imageUrl: submitted.imageUrl,
            imageAlt: submitted.imageAlt.trim(),
            caption,
          });
          setImages((current) => [...current, created]);
          return;
        }
        replaceImage(
          await updateGalleryImage(editor.image.id, {
            imageAlt: submitted.imageAlt.trim(),
            caption,
          }),
        );
      },
      editor.mode === "create"
        ? "La imagen quedó publicada en la galería."
        : "Los cambios quedaron publicados.",
      "No pudimos guardar la imagen. Intenta de nuevo.",
    );

    if (wasSaved) setEditor(null);
  }, [changedFields, editor, replaceImage, runWrite, submit]);

  const toggleStatus = useCallback(
    (image: GalleryImage) => {
      const isRetiring = image.status === "published";
      return runWrite(
        async () => {
          replaceImage(
            await updateGalleryImageStatus(image.id, isRetiring ? "retired" : "published"),
          );
        },
        isRetiring
          ? "La imagen se retiró del sitio. Sigue guardada en este listado."
          : "La imagen volvió a publicarse.",
        "No pudimos cambiar el estado de la imagen. Intenta de nuevo.",
      );
    },
    [replaceImage, runWrite],
  );

  return {
    ...form,
    images,
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
  };
}
