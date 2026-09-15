"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import PageDecor from "@/components/ui/page-decor";
import { keepDigits } from "@/lib/format/text";
import RoleSelector from "../components/role-selector";
import { useUserCreateForm } from "../hooks/use-user-create-form";

/** Formulario de creación. La lógica vive en use-user-create-form. */
export default function UserCreatePage() {
  const {
    values,
    errors,
    isSaving,
    submitError,
    needsProfessionalData,
    setValue,
    setFieldTouched,
    toggleRole,
    save,
    cancel,
  } = useUserCreateForm();

  return (
    <>
      <PageDecor variant="users" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-text"
        >
          <ArrowLeft size={16} aria-hidden />
          Volver a usuarios
        </Link>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl">
          Crear usuario
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Registra a una persona del equipo y asígnale sus roles.
        </p>

        <div className="mt-8 space-y-5 rounded-2xl border border-border bg-surface p-6">
          <TextField
            label="Nombre completo"
            required
            value={values.fullName}
            error={errors.fullName}
            maxLength={100}
            placeholder="Nombres y apellidos"
            onChange={(value) => setValue("fullName", value)}
            onBlur={() => setFieldTouched("fullName")}
          />

          <TextField
            label="Documento de identidad"
            required
            inputMode="numeric"
            value={values.identityDocument}
            error={errors.identityDocument}
            maxLength={10}
            placeholder="Sin puntos ni guiones"
            hint="Después no se podrá cambiar: identifica a la persona en el sistema."
            onChange={(value) => setValue("identityDocument", keepDigits(value))}
            onBlur={() => setFieldTouched("identityDocument")}
          />

          <TextField
            label="Correo"
            required
            type="email"
            inputMode="email"
            value={values.email}
            error={errors.email}
            maxLength={100}
            placeholder="nombre@gmail.com"
            hint="Con este correo entrará a SANA, así que debe ser una cuenta de Google."
            onChange={(value) => setValue("email", value)}
            onBlur={() => setFieldTouched("email")}
          />

          <TextField
            label="Número de contacto"
            required
            type="tel"
            inputMode="numeric"
            value={values.contactNumber}
            error={errors.contactNumber}
            maxLength={10}
            placeholder="Celular a 10 dígitos"
            onChange={(value) => setValue("contactNumber", keepDigits(value))}
            onBlur={() => setFieldTouched("contactNumber")}
          />

          <RoleSelector
            selectedRoleIds={values.roleIds}
            onToggleRole={toggleRole}
            error={errors.roleIds}
          />

          {needsProfessionalData && (
            <div className="space-y-5 rounded-xl border border-primary/30 bg-primary-soft/40 p-4">
              <p className="text-xs text-text-muted">
                El rol de psicólogo necesita estos datos para poder agendar
                citas.
              </p>

              <TextField
                label="Número de licencia profesional"
                required
                inputMode="numeric"
                value={values.licenseNumber}
                error={errors.licenseNumber}
                maxLength={20}
                onChange={(value) => setValue("licenseNumber", keepDigits(value))}
                onBlur={() => setFieldTouched("licenseNumber")}
              />

              <TextField
                label="Especialidad"
                required
                value={values.speciality}
                error={errors.speciality}
                maxLength={45}
                placeholder="Por ejemplo: psicología infantil"
                onChange={(value) => setValue("speciality", value)}
                onBlur={() => setFieldTouched("speciality")}
              />
            </div>
          )}

          <InlineMessage>
            Al crear la cuenta le llega un correo de aviso. Solo podrá entrar con
            la cuenta de Google registrada aquí.
          </InlineMessage>

          {submitError && (
            <InlineMessage tone="error">{submitError}</InlineMessage>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={cancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={isSaving}>
            {isSaving ? "Creando…" : "Crear usuario"}
          </Button>
        </div>
      </div>
    </>
  );
}