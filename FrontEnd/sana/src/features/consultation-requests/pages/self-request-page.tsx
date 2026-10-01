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
import { HUILA_MUNICIPALITIES } from "@/config/huila-municipalities";
import {
  COLOMBIA_DEPARTMENTS,
  NO_ZONE_REPORTED_LABEL,
} from "@/config/residence-zones";
import { VULNERABLE_POPULATION_OPTIONS } from "@/config/vulnerable-population";
import DataPolicyConsent from "../components/data-policy-consent";
import { useConsultationRequestForm } from "../hooks/use-consultation-request-form";
import type {
  AppointmentMode,
  CardType,
  Gender,
} from "../types/consultation-request-types";

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

const APPOINTMENT_MODE_OPTIONS: { value: AppointmentMode; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
];

/** HU-2.2: formulario de quien solicita la atención para sí mismo. */
export default function SelfRequestPage() {
  const {
    values,
    errors,
    isSaving,
    submitError,
    isValid,
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

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label={selfForm.fields.email}
                  required
                  type="email"
                  inputMode="email"
                  value={values.email}
                  error={errors.email}
                  onChange={(value) => setValue("email", value)}
                  onBlur={() => setFieldTouched("email")}
                />

                <TextField
                  label="Confirma tu correo"
                  required
                  type="email"
                  inputMode="email"
                  value={values.confirmEmail}
                  error={errors.confirmEmail}
                  placeholder="Escríbelo de nuevo"
                  onChange={(value) => setValue("confirmEmail", value)}
                  onBlur={() => setFieldTouched("confirmEmail")}
                />
              </div>

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

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-text">
                    {selfForm.fields.residenceZone} (opcional)
                  </span>
                  <select
                    value={values.department}
                    onChange={(event) => {
                      setValue("department", event.target.value);
                      setValue("municipality", "");
                    }}
                    className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">{NO_ZONE_REPORTED_LABEL}</option>
                    {COLOMBIA_DEPARTMENTS.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1.5 block text-xs text-text-subtle">
                    El departamento donde vives actualmente. Si prefieres no
                    indicarlo, deja “{NO_ZONE_REPORTED_LABEL}”.
                  </span>
                </label>

                {values.department === "Huila" ? (
                  <label className="block">
                    <span className="text-sm font-medium text-text">
                      Municipio
                    </span>
                    <select
                      value={values.municipality}
                      onChange={(event) =>
                        setValue("municipality", event.target.value)
                      }
                      onBlur={() => setFieldTouched("municipality")}
                      className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">Selecciona</option>
                      {HUILA_MUNICIPALITIES.map((municipality) => (
                        <option key={municipality} value={municipality}>
                          {municipality}
                        </option>
                      ))}
                    </select>
                    {errors.municipality && (
                      <span role="alert" className="mt-1.5 block text-xs text-danger">
                        {errors.municipality}
                      </span>
                    )}
                  </label>
                ) : (
                  values.department && (
                    <TextField
                      label="Municipio"
                      value={values.municipality}
                      error={errors.municipality}
                      placeholder="Ej. Bogotá"
                      onChange={(value) => setValue("municipality", value)}
                      onBlur={() => setFieldTouched("municipality")}
                    />
                  )
                )}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-text">
                {selfForm.sections.detail}
              </legend>

              <label className="block">
                <span className="text-sm font-semibold text-text">
                  Modalidad de la cita{" "}
                  <span className="text-danger" aria-hidden>
                    *
                  </span>
                </span>
                <select
                  value={values.appType}
                  onChange={(event) =>
                    setAppointmentMode(
                      event.target.value as AppointmentMode | "",
                    )
                  }
                  onBlur={() => setFieldTouched("appType")}
                  className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Selecciona</option>
                  {APPOINTMENT_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.appType && (
                  <span role="alert" className="mt-1.5 block text-xs text-danger">
                    {errors.appType}
                  </span>
                )}
              </label>

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
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
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

            <Button
              onClick={send}
              disabled={isSaving || !values.hasAcceptedDataPolicy || !isValid}
            >
              {isSaving ? "Enviando…" : selfForm.submit}
            </Button>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}