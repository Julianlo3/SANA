"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextAreaField from "@/components/forms/text-area-field";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import {
  CARD_DESCRIPTION_MAX_LENGTH,
  CARD_TITLE_MAX_LENGTH,
  SOCIAL_FIELDS,
  SOCIAL_URL_MAX_LENGTH,
  TEAM_GROUP_LABELS,
  TEAM_GROUP_OPTIONS,
  type CardSectionConfig,
} from "../config/content-sections";
import { useContentCards } from "../hooks/use-content-cards";
import { centeredSquareCrop, loadImageSize } from "../photo-crop";
import CroppedPhoto from "./cropped-photo";
import IconButton from "./icon-button";
import ImageUploadField from "./image-upload-field";
import LastEditNote from "./last-edit-note";
import PhotoCropField from "./photo-crop-field";

/**
 * Renders the card section editor component.
 * @param props Component properties.
 * @returns Rendered component.
 */
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
    isUploading,
    setIsUploading,
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
  const isBusy = isSaving || isUploading;
  const [isCropOpen, setIsCropOpen] = useState(false);
  const latestImageUrl = useRef("");

  async function handleImageChange(url: string | null) {
    const imageUrl = url ?? "";
    latestImageUrl.current = imageUrl;
    setValue("imageUrl", imageUrl);
    if (!config.teamProfile) return;

    setValue("photoCrop", null);
    if (!imageUrl) return;
    setIsCropOpen(true);
    try {
      const size = await loadImageSize(imageUrl);
      if (latestImageUrl.current === imageUrl) {
        setValue("photoCrop", centeredSquareCrop(size.width, size.height));
      }
    } catch {
      return;
    }
  }

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

          {config.teamProfile && (
            <fieldset>
              <legend className="flex items-center gap-2 text-sm font-semibold text-text">
                Grupo
                <span className="text-danger" aria-hidden>
                  *
                </span>
              </legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {TEAM_GROUP_OPTIONS.map((option) => {
                  const isSelected = values.teamGroup === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-text-subtle"
                      }`}
                    >
                      <input
                        type="radio"
                        name="teamGroup"
                        value={option.value}
                        checked={isSelected}
                        required
                        disabled={isSaving}
                        onChange={() => setValue("teamGroup", option.value)}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-text">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-text-subtle">
                          {option.hint}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.teamGroup && (
                <p role="alert" className="mt-1.5 text-xs text-danger">
                  {errors.teamGroup}
                </p>
              )}
            </fieldset>
          )}

          {description && (
            <TextAreaField
              label={description.label}
              required={description.required}
              value={values.description}
              error={errors.description}
              maxLength={CARD_DESCRIPTION_MAX_LENGTH}
              hint={description.hint}
              placeholder={description.placeholder}
              rows={config.teamProfile ? 6 : undefined}
              disabled={isSaving}
              onChange={(value) => setValue("description", value)}
              onBlur={() => setFieldTouched("description")}
            />
          )}

          {config.teamProfile && (
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-text">
                Redes sociales{" "}
                <span className="font-normal text-text-subtle">(opcional)</span>
              </legend>
              <p className="-mt-2 text-xs text-text-subtle">
                Solo se muestran las que tengan enlace.
              </p>
              {SOCIAL_FIELDS.map((social) => (
                <TextField
                  key={social.field}
                  label={social.label}
                  value={values[social.field]}
                  error={errors[social.field]}
                  placeholder={social.placeholder}
                  maxLength={SOCIAL_URL_MAX_LENGTH}
                  disabled={isSaving}
                  onChange={(value) => setValue(social.field, value)}
                  onBlur={() => setFieldTouched(social.field)}
                />
              ))}
            </fieldset>
          )}

          {config.image && (
            <div>
              <ImageUploadField
                folder="content"
                required={config.image.required}
                imageUrl={values.imageUrl || null}
                imageAlt={values.imageAlt}
                altError={errors.imageAlt}
                disabled={isSaving}
                onImageChange={handleImageChange}
                onAltChange={(alt) => setValue("imageAlt", alt)}
                onUploadingChange={setIsUploading}
              />
              {errors.imageUrl && (
                <p role="alert" className="mt-1.5 text-xs text-danger">
                  {errors.imageUrl}
                </p>
              )}
              {config.teamProfile && values.imageUrl && (
                <div className="mt-4">
                  <PhotoCropField
                    imageUrl={values.imageUrl}
                    imageAlt={values.imageAlt}
                    crop={values.photoCrop}
                    isOpen={isCropOpen}
                    disabled={isBusy}
                    onOpen={() => setIsCropOpen(true)}
                    onClose={() => setIsCropOpen(false)}
                    onChange={(crop) => setValue("photoCrop", crop)}
                  />
                </div>
              )}
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-3 text-sm text-text">
            <input
              type="checkbox"
              checked={values.isActive}
              disabled={isBusy}
              onChange={(event) => setValue("isActive", event.target.checked)}
              className="h-4 w-4 cursor-pointer accent-primary"
            />
            Mostrar en el sitio público
          </label>

          {actionError && (
            <InlineMessage tone="error">{actionError}</InlineMessage>
          )}

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
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-start"
            >
              {config.image && (
                card.imageUrl ? (
                  <CroppedPhoto
                    src={card.imageUrl}
                    alt={card.imageAlt ?? ""}
                    crop={card.photoCrop}
                    size={64}
                    className="h-16 w-16 shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-full bg-surface-muted" />
                )
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-text">{card.title}</p>
                  {config.teamProfile && card.teamGroup && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        card.teamGroup === "professional"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {TEAM_GROUP_LABELS[card.teamGroup]}
                    </span>
                  )}
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
