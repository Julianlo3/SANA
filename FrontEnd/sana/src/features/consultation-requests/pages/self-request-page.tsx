"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageDecor from "@/components/ui/page-decor";
import PublicHeader from "@/components/navigation/public-header";
import PublicFooter from "@/components/navigation/public-footer";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import { REQUEST_CONTENT } from "@/content/consultation-request";
import { keepDigits } from "@/lib/format/text";
import { VULNERABLE_POPULATION_OPTIONS } from "@/config/vulnerable-population";
import AppointmentModeField from "../components/appointment-mode-field";
import ConfirmedField from "../components/confirmed-field";
import DataPolicyConsent from "../components/data-policy-consent";
import ResidenceFields from "../components/residence-fields";
import { useConsultationRequestForm } from "../hooks/use-consultation-request-form";
import type { CardType, Gender } from "../types/consultation-request-types";

const { selfForm } = REQUEST_CONTENT;

const DOCUMENT_TYPES: { value: CardType; label: string }[] = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "M", label: "Hombre" },
  { value: "F", label: "Mujer" },
  { value: "O", label: "Otro" },
  { value: "P", label: "No quiero especificar" },
];

/** HU-2.2: formulario de quien solicita la atención para sí mismo. */
export default function SelfRequestPage() {
  const {
    values,
    errors,
    errorSummary,
    isSaving,
    submitError,
    setValue,
    setFieldTouched,
    setDocumentType,
    setGender,
    setAppointmentMode,
    toggleDataPolicy,
    send,
  } = useConsultationRequestForm("self");

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="relative flex-1 overflow-hidden">
        <PageDecor variant="auth" />

        <div className="relative z-10 mx-auto max-w-2xl px-6 py-16">
          <Link
            href="/solicitar-cita"
            className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-primary"
          >
            <ArrowLeft size={16} aria-hidden />
            Volver
          </Link>

          <span className="mt-6 block text-xs font-bold uppercase tracking-wider text-primary">
            {selfForm.eyebrow}
          </span>

          <h1 className="mt-2 font-display text-3xl font-extrabold text-primary-dark sm:text-4xl">
            {selfForm.title}
          </h1>

          <p className="mt-3 text-sm text-text-muted">
            {selfForm.description}
          </p>

          <div className="mt-8 space-y-8 rounded-2xl border border-border bg-surface p-6">
            <fieldset className="space-y-5">
              <legend className="text-sm font-semibold text-text">
                {selfForm.sections.personal}
              </legend>

              <TextField
                label={selfForm.fields.fullName}
                required
                value={values.fullName}
                error={errors.fullName}
                maxLength={100}
                onChange={(value) => setValue("fullName", value)}
                onBlur={() => setFieldTouched("fullName")}
              />

              <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
                <label className="block">
                  <span className="text-sm font-semibold text-text">
                    Tipo{" "}
                    <span className="text-danger" aria-hidden>
                      *
                    </span>
                  </span>
                  <select
                    value={values.documentType}
                    onChange={(event) =>
                      setDocumentType(event.target.value as CardType | "")
                    }
                    onBlur={() => setFieldTouched("documentType")}
                    aria-invalid={errors.documentType ? true : undefined}
                    className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Selecciona</option>
                    {DOCUMENT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.documentType && (
                    <span role="alert" className="mt-1.5 block text-xs text-danger">
                      {errors.documentType}
                    </span>
                  )}
                </label>

                <TextField
                  label={selfForm.fields.identityDocument}
                  required
                  inputMode="numeric"
                  value={values.identityDocument}
                  error={errors.identityDocument}
                  maxLength={12}
                  onChange={(value) =>
                    setValue("identityDocument", keepDigits(value))
                  }
                  onBlur={() => setFieldTouched("identityDocument")}
                />
              </div>

              <TextField
                label="Confirma el número de documento"
                required
                inputMode="numeric"
                value={values.confirmIdentityDocument}
                error={errors.confirmIdentityDocument}
                maxLength={12}
                placeholder="Escríbelo de nuevo"
                onChange={(value) =>
                  setValue("confirmIdentityDocument", keepDigits(value))
                }
                onBlur={() => setFieldTouched("confirmIdentityDocument")}
              />

              <p className="rounded-xl bg-primary-soft/40 px-4 py-3 text-xs text-text-muted">
                ¿Ya pediste una cita antes? Entra por Ingresar → Consultantes
                con tu cuenta de Google para ver cómo va.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-text">
                    {selfForm.fields.birthDate}{" "}
                    <span className="text-danger" aria-hidden>
                      *
                    </span>
                  </span>
                  <input
                    type="date"
                    value={values.birthDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(event) => setValue("birthDate", event.target.value)}
                    onBlur={() => setFieldTouched("birthDate")}
                    aria-invalid={errors.birthDate ? true : undefined}
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {errors.birthDate && (
                    <span role="alert" className="mt-1.5 block text-xs text-danger">
                      {errors.birthDate}
                    </span>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-text">
                    Género{" "}
                    <span className="text-danger" aria-hidden>
                      *
                    </span>
                  </span>
                  <select
                    value={values.gender}
                    onChange={(event) =>
                      setGender(event.target.value as Gender | "")
                    }
                    onBlur={() => setFieldTouched("gender")}
                    aria-invalid={errors.gender ? true : undefined}
                    className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Selecciona</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <span role="alert" className="mt-1.5 block text-xs text-danger">
                      {errors.gender}
                    </span>
                  )}
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-text">
                  ¿Perteneces a alguna población vulnerable? (opcional)
                </span>
                <select
                  defaultValue=""
                  className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Prefiero no decir</option>
                  {VULNERABLE_POPULATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 block text-xs text-text-subtle">
                  Esta información es opcional y nos ayuda a orientar mejor la
                  atención.
                </span>
              </label>
            </fieldset>

            <fieldset className="space-y-5">
              <legend className="text-sm font-semibold text-text">
                {selfForm.sections.contact}
              </legend>

              <ConfirmedField
                label={selfForm.fields.email}
                confirmLabel="Confirma tu correo"
                type="email"
                inputMode="email"
                value={values.email}
                confirmValue={values.confirmEmail}
                error={errors.email}
                confirmError={errors.confirmEmail}
                onChange={(value) => setValue("email", value)}
                onConfirmChange={(value) => setValue("confirmEmail", value)}
                onBlur={() => setFieldTouched("email")}
                onConfirmBlur={() => setFieldTouched("confirmEmail")}
              />

              <TextField
                label={selfForm.fields.phone}
                required
                type="tel"
                inputMode="numeric"
                value={values.phone}
                error={errors.phone}
                maxLength={12}
                onChange={(value) => setValue("phone", keepDigits(value))}
                onBlur={() => setFieldTouched("phone")}
              />

              <ResidenceFields
                department={values.department}
                municipality={values.municipality}
                municipalityError={errors.municipality}
                helperText="El departamento donde vives actualmente. Si prefieres no indicarlo, déjalo en blanco."
                onDepartmentChange={(value) => {
                  setValue("department", value);
                  setValue("municipality", "");
                }}
                onMunicipalityChange={(value) => setValue("municipality", value)}
                onMunicipalityBlur={() => setFieldTouched("municipality")}
              />
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-text">
                {selfForm.sections.detail}
              </legend>

              <AppointmentModeField
                value={values.appType}
                error={errors.appType}
                onChange={setAppointmentMode}
                onBlur={() => setFieldTouched("appType")}
              />

              <label className="mt-5 block">
                <span className="text-sm font-medium text-text">
                  {selfForm.fields.consultationReason}
                </span>
                <textarea
                  value={values.consultationReason}
                  onChange={(event) =>
                    setValue("consultationReason", event.target.value)
                  }
                  rows={4}
                  maxLength={1000}
                  placeholder={selfForm.reasonHint}
                  aria-invalid={errors.consultationReason ? true : undefined}
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.consultationReason && (
                  <span role="alert" className="mt-1.5 block text-xs text-danger">
                    {errors.consultationReason}
                  </span>
                )}
              </label>

              <p className="mt-4 rounded-xl bg-primary-soft/40 p-4 text-sm text-text-muted">
                Una vez enviada tu solicitud, te asignaremos una cita en el
                menor tiempo posible. Te contactaremos por correo o teléfono
                para confirmar la fecha y hora.
              </p>
            </fieldset>

            <DataPolicyConsent
              checked={values.hasAcceptedDataPolicy}
              onChange={toggleDataPolicy}
              error={errors.hasAcceptedDataPolicy}
              policyType="data_treatment"
            />

            {errorSummary.length > 0 && (
              <InlineMessage tone="error">
                Revisa estos campos: {errorSummary.join(", ")}.
              </InlineMessage>
            )}

            {submitError && (
              <InlineMessage tone="error">{submitError}</InlineMessage>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/solicitar-cita"
              className="rounded-full border border-border bg-surface px-6 py-3 text-center text-sm font-semibold text-text-muted transition hover:border-primary hover:text-primary"
            >
              {selfForm.cancel}
            </Link>

            <Button onClick={send} disabled={isSaving}>
              {isSaving ? "Enviando…" : selfForm.submit}
            </Button>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}