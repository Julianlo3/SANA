"use client";

import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextAreaField from "@/components/forms/text-area-field";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import {
  CARD_DESCRIPTION_MAX_LENGTH,
  CARD_TITLE_MAX_LENGTH,
  type CardSectionConfig,
} from "../config/content-sections";
import { useContentCards } from "../hooks/use-content-cards";
import LastEditNote from "./last-edit-note";

export default function CardSectionEditor({
  config,
}: {
  config: CardSectionConfig;
}) {
  const {
    cards,
    isLoading,
    loadError,
    editor,
    values,
    errors,
    isValid,
    isSaving,
    actionError,
    notice,
    cardToDelete,
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
  } = useContentCards(config);

  const { title, subtitle, description } = config.fields;

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-text-subtle">
        Cargando información…
      </p>
    );
  }

  if (loadError) return <InlineMessage tone="error">{loadError}</InlineMessage>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-text-muted">{config.description}</p>
        {!editor && (
          <Button onClick={openCreate}>
            <Plus size={16} aria-hidden />
            Agregar {config.itemName}
          </Button>
        )}
      </div>

      {editor && (
        <div className="space-y-5 rounded-2xl border border-primary/30 bg-surface p-6">
          <h3 className="font-display text-lg font-bold text-text">
            {editor.mode === "create"
              ? `Nuevo ${config.itemName}`
              : `Editar ${config.itemName}`}
          </h3>

          {title && (
            <TextField
              label={title.label}
              required={title.required}
              value={values.title}
              error={errors.title}
              maxLength={CARD_TITLE_MAX_LENGTH}
              disabled={isSaving}
              onChange={(value) => setValue("title", value)}
              onBlur={() => setFieldTouched("title")}
            />
          )}

          {subtitle && (
            <TextField
              label={subtitle.label}
              required={subtitle.required}
              value={values.subtitle}
              error={errors.subtitle}
              maxLength={CARD_TITLE_MAX_LENGTH}
              disabled={isSaving}
              onChange={(value) => setValue("subtitle", value)}
              onBlur={() => setFieldTouched("subtitle")}
            />
          )}

          {description && (
            <TextAreaField
              label={description.label}
              required={description.required}
              value={values.description}
              error={errors.description}
              maxLength={CARD_DESCRIPTION_MAX_LENGTH}
              disabled={isSaving}
              onChange={(value) => setValue("description", value)}
              onBlur={() => setFieldTouched("description")}
            />
          )}

          <label className="flex cursor-pointer items-center gap-3 text-sm text-text">
            <input
              type="checkbox"
              checked={values.isActive}
              disabled={isSaving}
              onChange={(event) => setValue("isActive", event.target.checked)}
              className="h-4 w-4 cursor-pointer accent-primary"
            />
            Mostrar en el sitio público
          </label>

          {actionError && (
            <InlineMessage tone="error">{actionError}</InlineMessage>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={cancelEdit} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!isValid || isSaving}>
              {isSaving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      )}

      {notice && <InlineMessage tone="success">{notice}</InlineMessage>}
      {!editor && actionError && (
        <InlineMessage tone="error">{actionError}</InlineMessage>
      )}

      {cards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-subtle">
          Todavía no hay elementos en esta sección. En el sitio público se
          muestra &quot;Información próxima a actualizarse&quot;.
        </p>
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-text">{card.title}</p>
                  {!card.isActive && (
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-text-subtle">
                      Oculto
                    </span>
                  )}
                </div>
                {card.subtitle && (
                  <p className="text-sm text-text-muted">{card.subtitle}</p>
                )}
                {card.description && (
                  <p className="line-clamp-2 text-sm text-text-muted">
                    {card.description}
                  </p>
                )}
                <LastEditNote
                  name={card.updatedBy.name}
                  updatedAt={card.updatedAt}
                />
              </div>

              <div className="flex shrink-0 gap-2">
                <IconButton
                  label={card.isActive ? "Ocultar del sitio" : "Mostrar en el sitio"}
                  onClick={() => toggleActive(card)}
                  disabled={isSaving || Boolean(editor)}
                >
                  {card.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
                <IconButton
                  label="Editar"
                  onClick={() => openEdit(card)}
                  disabled={isSaving || Boolean(editor)}
                >
                  <Pencil size={16} />
                </IconButton>
                <IconButton
                  label="Eliminar"
                  onClick={() => requestDelete(card)}
                  disabled={isSaving || Boolean(editor)}
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cardToDelete && (
        <Modal
          title={`Eliminar ${config.itemName}`}
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
            &quot;{cardToDelete.title}&quot; dejará de mostrarse y no se podrá
            recuperar. Si solo quieres quitarlo del sitio por un tiempo, usa
            &quot;Ocultar del sitio&quot;.
          </p>
        </Modal>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-lg border border-border p-2 text-text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
