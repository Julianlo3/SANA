"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import {
  createBanner,
  deleteBanner,
  getBanners,
  updateBanner,
  updateBannerActivation,
} from "../services/banners-service";
import type { Banner, BannerPayload } from "../types/content-types";

export type BannerFormValues = {
  title: string;
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
};

const EMPTY_VALUES: BannerFormValues = {
  title: "",
  imageUrl: "",
  imageAlt: "",
  isActive: false,
};

type Editor = { mode: "create" } | { mode: "edit"; banner: Banner } | null;

function toFormValues(banner: Banner): BannerFormValues {
  return {
    title: banner.title,
    imageUrl: banner.imageUrl ?? "",
    imageAlt: banner.imageAlt ?? "",
    isActive: banner.isActive,
  };
}

function toPayload(values: BannerFormValues): BannerPayload {
  const imageUrl = values.imageUrl || null;
  return {
    title: values.title.trim(),
    imageUrl,
    imageAlt: imageUrl ? values.imageAlt.trim() : null,
  };
}

function validate(values: BannerFormValues): Partial<Record<keyof BannerFormValues, string>> {
  const errors: Partial<Record<keyof BannerFormValues, string>> = {};
  if (!values.title.trim()) errors.title = "Escribe el título.";
  if (values.imageUrl && !values.imageAlt.trim()) errors.imageAlt = "Describe la imagen.";
  if (values.isActive && !values.imageUrl) errors.imageUrl = "Sube una imagen para activarlo.";
  return errors;
}

function countActive(items: Banner[]): number {
  return items.filter((item) => item.isActive).length;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useBannersManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [maxActive, setMaxActive] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const initialValues = useMemo(
    () => (editor?.mode === "edit" ? toFormValues(editor.banner) : EMPTY_VALUES),
    [editor],
  );
  const form = useForm<BannerFormValues>({ initialValues, validate });
  const { reset, submit, changedFields } = form;

  useEffect(() => {
    const controller = new AbortController();

    getBanners(controller.signal)
      .then((found) => {
        if (controller.signal.aborted) return;
        setBanners(found.items);
        setMaxActive(found.maxActive);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(errorMessage(error, "No pudimos cargar los banners."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const replaceBanner = useCallback((updated: Banner) => {
    setBanners((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  const runWrite = useCallback(
    async (write: () => Promise<void>, successNotice: string, fallback: string) => {
      setIsSaving(true);
      setActionError(null);
      setNotice(null);
      try {
        await write();
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
    (banner: Banner) => {
      setEditor({ mode: "edit", banner });
      reset(toFormValues(banner));
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
          const created = await createBanner({ ...payload, isActive: submitted.isActive });
          setBanners((current) => [created, ...current]);
          return;
        }
        const changes: Partial<BannerPayload> = {};
        if (changedFields.includes("title")) changes.title = payload.title;
        if (changedFields.includes("imageUrl") || changedFields.includes("imageAlt")) {
          changes.imageUrl = payload.imageUrl;
          changes.imageAlt = payload.imageAlt;
        }
        replaceBanner(await updateBanner(editor.banner.id, changes));
      },
      editor.mode === "create" ? "El banner quedó guardado." : "Los cambios quedaron guardados.",
      "No pudimos guardar el banner. Intenta de nuevo.",
    );

    if (wasSaved) setEditor(null);
  }, [changedFields, editor, replaceBanner, runWrite, submit]);

  const toggleActive = useCallback(
    (banner: Banner) =>
      runWrite(
        async () => {
          replaceBanner(await updateBannerActivation(banner.id, !banner.isActive));
        },
        banner.isActive
          ? "El banner salió del inicio. Sigue guardado para reutilizarlo."
          : "El banner quedó activo. Ya se muestra en el inicio.",
        "No pudimos cambiar el estado del banner. Intenta de nuevo.",
      ),
    [replaceBanner, runWrite],
  );

  const confirmDelete = useCallback(async () => {
    if (!bannerToDelete) return;
    const target = bannerToDelete;
    const wasDeleted = await runWrite(
      async () => {
        await deleteBanner(target.id);
        setBanners((current) => current.filter((item) => item.id !== target.id));
      },
      "El banner fue eliminado definitivamente.",
      "No pudimos eliminar el banner. Intenta de nuevo.",
    );
    if (wasDeleted) setBannerToDelete(null);
  }, [bannerToDelete, runWrite]);

  return {
    ...form,
    banners,
    activeCount: countActive(banners),
    maxActive,
    isLoading,
    loadError,
    editor,
    isSaving,
    isUploading,
    setIsUploading,
    actionError,
    notice,
    bannerToDelete,
    openCreate,
    openEdit,
    cancelEdit,
    save,
    toggleActive,
    requestDelete: setBannerToDelete,
    cancelDelete: () => setBannerToDelete(null),
    confirmDelete,
  };
}
