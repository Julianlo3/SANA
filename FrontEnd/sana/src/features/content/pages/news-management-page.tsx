"use client";

import Image from "next/image";
import { Archive, Pencil, Pin, Plus, RotateCcw, Trash2 } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import PageDecor from "@/components/ui/page-decor";
import IconButton from "../components/icon-button";
import ImageUploadField from "../components/image-upload-field";
import LastEditNote from "../components/last-edit-note";
import RichTextField from "../components/rich-text-field";
import StatusBadge from "../components/status-badge";
import StatusFilter from "../components/status-filter";
import {
  NEWS_BODY_MAX_LENGTH,
  NEWS_TITLE_MAX_LENGTH,
} from "../config/content-sections";
import { formatDate, toExcerpt } from "../format";
import { useNewsManagement } from "../hooks/use-news-management";

export default function NewsManagementPage() {
  const {
    news,
    counts,
    filter,
    setFilter,
    newsToDelete,
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
    togglePin,
  } = useNewsManagement();

  const isBusy = isSaving || isUploading;

  return (
    <>
      <PageDecor variant="default" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl">
              Noticias
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text-muted">
              Las noticias publicadas aparecen en el sitio de la más reciente a
              la más antigua. Fija una para que siempre quede primera.
            </p>
          </div>
          {!editor && (
            <Button onClick={openCreate}>
              <Plus size={16} aria-hidden />
              Publicar noticia
            </Button>
          )}
        </div>

        {editor && (
          <div className="space-y-5 rounded-2xl border border-primary/30 bg-surface p-6">
            <h2 className="font-display text-lg font-bold text-text">
              {editor.mode === "create" ? "Nueva noticia" : "Editar noticia"}
            </h2>

            <TextField
              label="Título"
              required
              value={values.title}
              error={errors.title}
              maxLength={NEWS_TITLE_MAX_LENGTH}
              disabled={isBusy}
              onChange={(value) => setValue("title", value)}
              onBlur={() => setFieldTouched("title")}
            />

            <RichTextField
              label="Contenido"
              required
              value={values.body}
              error={errors.body}
              maxLength={NEWS_BODY_MAX_LENGTH}
              disabled={isBusy}
              onChange={(value) => setValue("body", value)}
              onBlur={() => setFieldTouched("body")}
            />

            <ImageUploadField
              folder="news"
              imageUrl={values.imageUrl || null}
              imageAlt={values.imageAlt}
              altError={errors.imageAlt}
              disabled={isSaving}
              onImageChange={(url) => setValue("imageUrl", url ?? "")}
              onAltChange={(alt) => setValue("imageAlt", alt)}
              onUploadingChange={setIsUploading}
            />

            <p className="text-xs text-text-subtle">
              {editor.mode === "create"
                ? "La fecha de publicación será la de hoy."
                : `Publicada el ${formatDate(editor.news.publishedAt)}. Editarla no cambia la fecha.`}
            </p>

            {actionError && <InlineMessage tone="error">{actionError}</InlineMessage>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={cancelEdit} disabled={isBusy}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={!isValid || isBusy}>
                {isSaving
                  ? "Guardando…"
                  : editor.mode === "create"
                    ? "Publicar"
                    : "Guardar"}
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
          <p className="py-12 text-center text-sm text-text-subtle">Cargando noticias…</p>
        ) : loadError ? (
          <InlineMessage tone="error">{loadError}</InlineMessage>
        ) : counts.all > 0 && news.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-subtle">
            No hay noticias en esta vista.
          </p>
        ) : news.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-subtle">
            Todavía no hay noticias. En el sitio público se muestra
            &quot;Información próxima a actualizarse&quot;.
          </p>
        ) : (
          <ul className="space-y-3">
            {news.map((item) => (
              <li
                key={item.id}
                className={`flex flex-col gap-4 rounded-2xl border bg-surface p-5 sm:flex-row ${
                  item.isPinned ? "border-primary/40" : "border-border"
                }`}
              >
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:w-32">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt ?? ""}
                      fill
                      sizes="128px"
                      className={`object-cover ${item.status === "retired" ? "grayscale" : ""}`}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.isPinned && (
                      <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                        <Pin size={12} aria-hidden />
                        Fijada
                      </span>
                    )}
                    <span className="text-xs text-text-subtle">
                      {formatDate(item.publishedAt)}
                    </span>
                  </div>
                  <p className="font-semibold text-text">{item.title}</p>
                  <p className="line-clamp-2 text-sm text-text-muted">{toExcerpt(item.body)}</p>
                  <LastEditNote name={item.updatedBy.name} updatedAt={item.updatedAt} />
                </div>

                <div className="flex shrink-0 gap-2 sm:flex-col">
                  {item.status === "published" && (
                    <IconButton
                      label={item.isPinned ? "Dejar de fijar" : "Fijar primera"}
                      isActive={item.isPinned}
                      onClick={() => togglePin(item)}
                      disabled={isBusy || Boolean(editor)}
                    >
                      <Pin size={16} />
                    </IconButton>
                  )}
                  <IconButton
                    label="Editar"
                    onClick={() => openEdit(item)}
                    disabled={isBusy || Boolean(editor)}
                  >
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton
                    label={item.status === "published" ? "Retirar del sitio" : "Volver a publicar"}
                    onClick={() => toggleStatus(item)}
                    disabled={isBusy || Boolean(editor)}
                  >
                    {item.status === "published" ? <Archive size={16} /> : <RotateCcw size={16} />}
                  </IconButton>
                  {item.status === "retired" && (
                    <IconButton
                      label="Eliminar definitivamente"
                      onClick={() => requestDelete(item)}
                      disabled={isBusy || Boolean(editor)}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {newsToDelete && (
        <Modal
          title="Eliminar noticia"
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
            &quot;{newsToDelete.title}&quot; se eliminará definitivamente y no se
            podrá recuperar.
          </p>
        </Modal>
      )}
    </>
  );
}
