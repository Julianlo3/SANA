"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import PageDecor from "@/components/ui/page-decor";
import { keepDigits } from "@/lib/format/text";
import RoleSelector from "../components/role-selector";
import { useUserEditForm } from "../hooks/use-user-edit-form";

/** Formulario de edición. La lógica vive en use-user-edit-form. */
export default function UserEditPage({ userId }: { userId: number }) {
  const {
    user,
    values,
    errors,
    isLoading,
    loadError,
    isEditingEnabled,
    toggleEditing,
    toggleRole,
    toggleRoleActive,
    needsProfessionalData,
    changedFieldLabels,
    isDirty,
    isSaving,
    submitError,
    wasSaved,
    setValue,
    setFieldTouched,
    save,
    cancel,
  } = useUserEditForm(userId);

  if (isLoading) {
    return (
      <p className="py-20 text-center text-sm text-text-subtle">
        Cargando información…
      </p>
    );
  }

  if (loadError || !user) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-primary-dark">
          No encontramos este usuario
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          {loadError ?? "La cuenta no existe o fue eliminada."}
        </p>
        <div className="mt-8 flex justify-center">
          <Button onClick={cancel}>Volver a usuarios</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageDecor variant="users" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-text"
        >
          <ArrowLeft size={16} aria-hidden />
          Volver a usuarios
        </Link>

        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl">
          {user.fullName}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Consulta la información de la cuenta. Para cambiar algo, habilita la
          edición.
        </p>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface p-4">
          <input
            type="checkbox"
            checked={isEditingEnabled}
            onChange={(event) => toggleEditing(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
          />
          <span className="text-sm text-text">
            Habilitar la edición de esta cuenta
            <span className="mt-0.5 block text-xs text-text-subtle">
              Mientras esté desmarcado, los campos quedan en solo lectura. Al
              desmarcarlo se descartan los cambios que no hayas guardado.
            </span>
          </span>
        </label>

        <div className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6">
          <TextField
            label="Nombre completo"
            required
            value={values.fullName}
            error={errors.fullName}
            maxLength={100}
            disabled={!isEditingEnabled}
            onChange={(value) => setValue("fullName", value)}
            onBlur={() => setFieldTouched("fullName")}
          />

          <TextField
            label="Documento de identidad"
            locked
            value={values.identityDocument}
            hint="Identifica a la persona en todo el sistema. Si quedó mal registrado, pídele el cambio al equipo de desarrollo."
          />

          <TextField
            label="Correo"
            locked
            value={values.email}
            hint="Es la cuenta de Google con la que inicia sesión, por eso no se puede cambiar."
          />

          <TextField
            label="Número de contacto"
            required
            type="tel"
            inputMode="numeric"
            value={values.contactNumber}
            error={errors.contactNumber}
            maxLength={10}
            disabled={!isEditingEnabled}
            onChange={(value) => setValue("contactNumber", keepDigits(value))}
            onBlur={() => setFieldTouched("contactNumber")}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <RoleSelector
            selectedRoleIds={values.roleIds}
            inactiveRoleIds={values.inactiveRoleIds}
            onToggleRole={toggleRole}
            onToggleRoleActive={toggleRoleActive}
            error={errors.roleIds}
            disabled={!isEditingEnabled}
          />

          {needsProfessionalData && (
            <div className="mt-5 space-y-5 rounded-xl border border-primary/30 bg-primary-soft/40 p-4">
              <TextField
                label="Número de licencia profesional"
                required
                inputMode="numeric"
                value={values.licenseNumber}
                error={errors.licenseNumber}
                maxLength={20}
                disabled={!isEditingEnabled}
                onChange={(value) => setValue("licenseNumber", keepDigits(value))}
                onBlur={() => setFieldTouched("licenseNumber")}
              />

              <TextField
                label="Especialidad"
                required
                value={values.speciality}
                error={errors.speciality}
                maxLength={45}
                disabled={!isEditingEnabled}
                onChange={(value) => setValue("speciality", value)}
                onBlur={() => setFieldTouched("speciality")}
              />
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {isEditingEnabled && changedFieldLabels.length > 0 && (
            <InlineMessage>
              Vas a cambiar: {changedFieldLabels.join(", ")}. Los roles se
              aplican en el siguiente inicio de sesión de la persona.
            </InlineMessage>
          )}

          {wasSaved && (
            <InlineMessage tone="success">
              Los cambios quedaron guardados.
            </InlineMessage>
          )}

          {submitError && (
            <InlineMessage tone="error">{submitError}</InlineMessage>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={cancel} disabled={isSaving}>
            Volver a usuarios
          </Button>
          <Button
            onClick={save}
            disabled={!isEditingEnabled || !isDirty || isSaving}
          >
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </>
  );
}