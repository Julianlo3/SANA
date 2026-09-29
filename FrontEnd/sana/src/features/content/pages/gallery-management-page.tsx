"use client";

import Image from "next/image";
import { Archive, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import PageDecor from "@/components/ui/page-decor";
import IconButton from "../components/icon-button";
import ImageUploadField from "../components/image-upload-field";
import LastEditNote from "../components/last-edit-note";
import StatusBadge from "../components/status-badge";
import StatusFilter from "../components/status-filter";
import {
  GALLERY_CAPTION_MAX_LENGTH,
  IMAGE_ALT_MAX_LENGTH,
} from "../config/content-sections";
import { useGalleryManagement } from "../hooks/use-gallery-management";

export default function GalleryManagementPage() {
  const {
    images,
    counts,
    filter,
    setFilter,
    imageToDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isLoading,
    loadError,
    editor,
    values,
    errors,
    isValid,
    isSaving,
    isUploading,
    setIsUploading,
    actionError,
    notice,
    setValue,
    setFieldTouched,
    openCreate,
    openEdit,
    cancelEdit,
    save,
    toggleStatus,
  } = useGalleryManagement();

  const isBusy = isSaving || isUploading;

  return (
    <>
      <PageDecor variant="default" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl">
              Galería
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text-muted">
              Fotos de las actividades y logros de la fundación.
            </p>
          </div>
          {!editor && (
            <Button onClick={openCreate}>
              <Plus size={16} aria-hidden />
              Agregar imagen
            </Button>
          )}
        </div>

        {editor && (
          <div className="space-y-5 rounded-2xl border border-primary/30 bg-surface p-6">
            <h2 className="font-display text-lg font-bold text-text">
              {editor.mode === "create" ? "Nueva imagen" : "Editar imagen"}
            </h2>

            {editor.mode === "create" ? (
              <ImageUploadField
                folder="gallery"
                required
                imageUrl={values.imageUrl || null}
                imageAlt={values.imageAlt}
                altError={errors.imageAlt}
                disabled={isSaving}
                onImageChange={(url) => setValue("imageUrl", url ?? "")}
                onAltChange={(alt) => setValue("imageAlt", alt)}
                onUploadingChange={setIsUploading}
              />
            ) : (
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="relative aspect-[4/3] w-full max-w-56 overflow-hidden rounded-xl bg-surface-muted">
                  <Image src={values.imageUrl} alt={values.imageAlt} fill sizes="224px" className="object-cover" />
                </div>
                <div className="flex-1">
                  <TextField
                    label="Descripción de la imagen"
                    required
                    value={values.imageAlt}
                    error={errors.imageAlt}
                    maxLength={IMAGE_ALT_MAX_LENGTH}
                    disabled={isBusy}
                    onChange={(value) => setValue("imageAlt", value)}
                    onBlur={() => setFieldTouched("imageAlt")}
                  />
                </div>
              </div>
            )}

            <TextField
              label="Pie de foto"
              value={values.caption}
              maxLength={GALLERY_CAPTION_MAX_LENGTH}
              disabled={isBusy}
              hint="Opcional. Se muestra debajo de la imagen."
              onChange={(value) => setValue("caption", value)}
            />

            {actionError && <InlineMessage tone="error">{actionError}</InlineMessage>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={cancelEdit} disabled={isBusy}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={!isValid || isBusy}>
                {isSaving ? "Guardando…" : editor.mode === "create" ? "Publicar" : "Guardar"}
              </Button>
            </div>
          </div>
        )}

        {!editor && counts.all > 0 && (
          <StatusFilter value={filter} onChange={setFilter} counts={counts} />
        )}

        {notice && <InlineMessage tone="success">{notice}</InlineMessage>}
        {!editor && actionError && <InlineMessage tone="error">{actionError}</InlineMessage>}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-text-subtle">Cargando galería…</p>
        ) : loadError ? (
          <InlineMessage tone="error">{loadError}</InlineMessage>
        ) : counts.all > 0 && images.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-subtle">
            No hay imágenes en esta vista.
          </p>
        ) : images.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-subtle">
            Todavía no hay imágenes. En el sitio público se muestra
            &quot;Información próxima a actualizarse&quot;.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <li key={image.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="relative aspect-[4/3] bg-surface-muted">
                  <Image
                    src={image.imageUrl}
                    alt={image.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, 300px"
                    className={`object-cover ${image.status === "retired" ? "grayscale" : ""}`}
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={image.status} />
                    <div className="flex gap-2">
                      <IconButton
                        label="Editar"
                        onClick={() => openEdit(image)}
                        disabled={isBusy || Boolean(editor)}
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        label={image.status === "published" ? "Retirar del sitio" : "Volver a publicar"}
                        onClick={() => toggleStatus(image)}
                        disabled={isBusy || Boolean(editor)}
                      >
                        {image.status === "published" ? <Archive size={16} /> : <RotateCcw size={16} />}
                      </IconButton>
                      {image.status === "retired" && (
                        <IconButton
                          label="Eliminar definitivamente"
                          onClick={() => requestDelete(image)}
                          disabled={isBusy || Boolean(editor)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                    </div>
                  </div>
                  {image.caption && <p className="text-sm text-text-muted">{image.caption}</p>}
                  <LastEditNote name={image.updatedBy.name} updatedAt={image.updatedAt} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {imageToDelete && (
        <Modal
          title="Eliminar imagen"
          onClose={cancelDelete}
          footer={
            <>
              <Button variant="secondary" onClick={cancelDelete} disabled={isSaving}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isSaving}>
                {isSaving ? "Eliminando…" : "Eliminar"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-muted">
            La imagen se eliminará definitivamente de la galería y no se podrá
            recuperar.
          </p>
        </Modal>
      )}
    </>
  );
}
