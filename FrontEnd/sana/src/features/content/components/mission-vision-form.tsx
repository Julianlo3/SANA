"use client";

import InlineMessage from "@/components/feedback/inline-message";
import TextAreaField from "@/components/forms/text-area-field";
import Button from "@/components/ui/button";
import { TEXT_MAX_LENGTH } from "../config/content-sections";
import { useMissionVisionForm } from "../hooks/use-mission-vision-form";
import LastEditNote from "./last-edit-note";

export default function MissionVisionForm() {
  const {
    values,
    errors,
    isDirty,
    isValid,
    lastEdit,
    isLoading,
    loadError,
    isSaving,
    submitError,
    wasSaved,
    setValue,
    setFieldTouched,
    save,
    cancel,
  } = useMissionVisionForm();

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
      <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
        <TextAreaField
          label="Misión"
          required
          rows={5}
          value={values.mission}
          error={errors.mission}
          maxLength={TEXT_MAX_LENGTH}
          disabled={isSaving}
          onChange={(value) => setValue("mission", value)}
          onBlur={() => setFieldTouched("mission")}
        />

        <TextAreaField
          label="Visión"
          required
          rows={5}
          value={values.vision}
          error={errors.vision}
          maxLength={TEXT_MAX_LENGTH}
          disabled={isSaving}
          onChange={(value) => setValue("vision", value)}
          onBlur={() => setFieldTouched("vision")}
        />

        {lastEdit?.updatedAt && lastEdit.updatedBy && (
          <LastEditNote
            name={lastEdit.updatedBy.name}
            updatedAt={lastEdit.updatedAt}
          />
        )}
      </div>

      {wasSaved && (
        <InlineMessage tone="success">
          Los cambios quedaron publicados.
        </InlineMessage>
      )}
      {submitError && <InlineMessage tone="error">{submitError}</InlineMessage>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={cancel}
          disabled={!isDirty || isSaving}
        >
          Cancelar
        </Button>
        <Button onClick={save} disabled={!isDirty || !isValid || isSaving}>
          {isSaving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
