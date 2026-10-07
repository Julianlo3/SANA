"use client";

import Image from "next/image";
import { Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import PageDecor from "@/components/ui/page-decor";
import IconButton from "../components/icon-button";
import ImageUploadField from "../components/image-upload-field";
import LastEditNote from "../components/last-edit-note";
import { useBannersManagement } from "../hooks/use-banners-management";

const BANNER_TITLE_MAX_LENGTH = 120;

const STATE_STYLES = {
  active: { label: "Activo", className: "bg-success-soft text-success" },
  inactive: { label: "Inactivo", className: "border border-border text-text-subtle" },
};

export default function BannersManagementPage() {
  const {
    banners,
    activeCount,
    maxActive,
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
    bannerToDelete,
    setValue,
    setFieldTouched,
    openCreate,
    openEdit,
    cancelEdit,
    save,
    toggleActive,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useBannersManagement();

  const isBusy = isSaving || isUploading;
  const isLimitReached = activeCount >= maxActive;

  return (
    <>
      <PageDecor variant="default" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl">
              Banners
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text-muted">
              Los banners activos rotan en la primera pantalla del inicio.
              Siempre debe quedar al menos uno activo.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-border bg-surface px-5 py-3 text-right">
              <p className="text-xs text-text-subtle">Activos</p>
              <p className={`font-display text-2xl font-bold ${isLimitReached ? "text-accent-strong" : "text-primary"}`}>
                {activeCount} de {maxActive}
              </p>
            </div>
            {!editor && (
              <Button onClick={openCreate}>
                <Plus size={16} aria-hidden />
                Nuevo banner
              </Button>
            )}
          </div>
        </div>

        {editor && (
          <div className="space-y-5 rounded-2xl border border-primary/30 bg-surface p-6">
            <h2 className="font-display text-lg font-bold text-text">
              {editor.mode === "create" ? "Nuevo banner" : "Editar banner"}
            </h2>

            <TextField
              label="Título"
              required
              value={values.title}
              error={errors.title}
              maxLength={BANNER_TITLE_MAX_LENGTH}
              disabled={isBusy}
              hint="Solo se usa en el panel para reconocerlo."
              onChange={(value) => setValue("title", value)}
              onBlur={() => setFieldTouched("title")}
            />

            <div>
              <ImageUploadField
                folder="banners"
                imageUrl={values.imageUrl || null}
                imageAlt={values.imageAlt}
                altError={errors.imageAlt}
                disabled={isSaving}
                onImageChange={(url) => setValue("imageUrl", url ?? "")}
                onAltChange={(alt) => setValue("imageAlt", alt)}
                onUploadingChange={setIsUploading}
              />
              <p className="mt-1.5 text-xs text-text-subtle">
                Medida recomendada: 1920 × 1080 px. Evita poner lo importante en
                el centro y en los bordes laterales: ahí van el texto y las curvas
                del inicio.
              </p>
              {errors.imageUrl && (
                <p role="alert" className="mt-1.5 text-xs text-danger">
                  {errors.imageUrl}
                </p>
              )}
            </div>

            {editor.mode === "create" && (
              <label className="flex cursor-pointer items-start gap-3 text-sm text-text">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  disabled={isBusy || isLimitReached}
                  onChange={(event) => setValue("isActive", event.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                />
                <span>
                  Activar al guardar
                  <span className="mt-0.5 block text-xs text-text-subtle">
                    {isLimitReached
                      ? `Ya hay ${maxActive} banners activos. Puedes guardarlo inactivo y activarlo después.`
                      : "Necesita imagen. Si no lo activas, queda guardado para usarlo después."}
                  </span>
                </span>
              </label>
            )}

            {actionError && <InlineMessage tone="error">{actionError}</InlineMessage>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={cancelEdit} disabled={isBusy}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={!isValid || isBusy}>
                {isSaving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        )}

        {notice && <InlineMessage tone="success">{notice}</InlineMessage>}
        {!editor && actionError && <InlineMessage tone="error">{actionError}</InlineMessage>}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-text-subtle">Cargando banners…</p>
        ) : loadError ? (
          <InlineMessage tone="error">{loadError}</InlineMessage>
        ) : banners.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-subtle">
            Todavía no hay banners. Crea uno y actívalo para que aparezca en la
            primera pantalla del inicio.
          </p>
        ) : (
          <ul className="space-y-3">
            {banners.map((banner) => {
              const state = STATE_STYLES[banner.isActive ? "active" : "inactive"];
              const isLastActive = banner.isActive && activeCount === 1;
              return (
                <li
                  key={banner.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row"
                >
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:w-56">
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.imageAlt ?? ""}
                        fill
                        sizes="224px"
                        className={`object-cover ${banner.isActive ? "" : "grayscale"}`}
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-text-subtle">
                        Sin imagen
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${state.className}`}>
                      {state.label}
                    </span>
                    <p className="font-semibold text-text">{banner.title}</p>
                    {isLastActive && (
                      <p className="text-xs text-text-subtle">
                        Es el único activo. Activa otro antes de desactivarlo.
                      </p>
                    )}
                    <LastEditNote name={banner.updatedBy.name} updatedAt={banner.updatedAt} />
                  </div>

                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <IconButton
                      label={
                        isLastActive
                          ? "Es el único banner activo. Activa otro para poder desactivarlo."
                          : banner.isActive
                            ? "Desactivar"
                            : "Activar"
                      }
                      isActive={banner.isActive}
                      onClick={() => toggleActive(banner)}
                      disabled={isBusy || Boolean(editor) || isLastActive}
                    >
                      {banner.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                    </IconButton>
                    <IconButton
                      label="Editar"
                      onClick={() => openEdit(banner)}
                      disabled={isBusy || Boolean(editor)}
                    >
                      <Pencil size={16} />
                    </IconButton>
                    {!banner.isActive && (
                      <IconButton
                        label="Eliminar definitivamente"
                        onClick={() => requestDelete(banner)}
                        disabled={isBusy || Boolean(editor)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {bannerToDelete && (
        <Modal
          title="Eliminar banner"
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
            &quot;{bannerToDelete.title}&quot; se eliminará definitivamente. Si
            solo quieres sacarlo del inicio, déjalo inactivo para reutilizarlo.
          </p>
        </Modal>
      )}
    </>
  );
}
