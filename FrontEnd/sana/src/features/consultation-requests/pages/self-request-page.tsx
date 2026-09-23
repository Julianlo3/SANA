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
import {
  COLOMBIA_DEPARTMENTS,
  DEFAULT_DEPARTMENT,
  NO_ZONE_REPORTED_LABEL,
} from "@/config/residence-zones";
import DataPolicyConsent from "../components/data-policy-consent";
import { useConsultationRequestForm } from "../hooks/use-consultation-request-form";
import type {
  AdultDocumentType,
  Gender,
} from "../types/consultation-request-types";

const { selfForm } = REQUEST_CONTENT;

const DOCUMENT_TYPES: { value: AdultDocumentType; label: string }[] = [
  { value: "cc", label: "Cédula de ciudadanía" },
  { value: "ce", label: "Cédula de extranjería" },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "female", label: "Femenino" },
  { value: "male", label: "Masculino" },
  { value: "other", label: "Otro" },
  { value: "preferNotToSay", label: "Prefiero no decir" },
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
                    Tipo
                    <span className="text-danger" aria-hidden>
                      {" "}
                      *
                    </span>
                  </span>
                  <select
                    value={values.documentType}
                    onChange={(event) =>
                      setDocumentType(
                        event.target.value as AdultDocumentType | "",
                      )
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
                  maxLength={10}
                  onChange={(value) =>
                    setValue("identityDocument", keepDigits(value))
                  }
                  onBlur={() => setFieldTouched("identityDocument")}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-text">
                    {selfForm.fields.birthDate}
                    <span className="text-danger" aria-hidden>
                      {" "}
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
                  <span className="text-sm font-medium text-text">
                    Género (opcional)
                  </span>
                  <select
                    value={values.gender}
                    onChange={(event) =>
                      setGender(event.target.value as Gender | "")
                    }
                    className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Prefiero no indicarlo</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
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
                  label={selfForm.fields.phone}
                  required
                  type="tel"
                  inputMode="numeric"
                  value={values.phone}
                  error={errors.phone}
                  maxLength={10}
                  onChange={(value) => setValue("phone", keepDigits(value))}
                  onBlur={() => setFieldTouched("phone")}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-text">
                    {selfForm.fields.residenceZone} (opcional)
                  </span>
                  <select
                    value={values.department}
                    onChange={(event) => setValue("department", event.target.value)}
                    className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">{NO_ZONE_REPORTED_LABEL}</option>
                    {COLOMBIA_DEPARTMENTS.map((department) => (
                      <option
                        key={department}
                        value={department}
                        selected={department === DEFAULT_DEPARTMENT}
                      >
                        {department}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1.5 block text-xs text-text-subtle">
                    El departamento donde vives actualmente. Si prefieres no
                    indicarlo, deja “{NO_ZONE_REPORTED_LABEL}”.
                  </span>
                </label>

                {values.department && (
                  <TextField
                    label="Municipio"
                    value={values.municipality}
                    error={errors.municipality}
                    placeholder="Ej. Neiva"
                    onChange={(value) => setValue("municipality", value)}
                    onBlur={() => setFieldTouched("municipality")}
                  />
                )}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-text">
                {selfForm.sections.detail}
              </legend>

              <label className="block">
                <span className="text-sm font-medium text-text">
                  {selfForm.fields.consultationReason}
                </span>
                <textarea
                  value={values.consultationReason}
                  onChange={(event) =>
                    setValue("consultationReason", event.target.value)
                  }
                  rows={4}
                  maxLength={500}
                  placeholder={selfForm.reasonHint}
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </label>
            </fieldset>

            <DataPolicyConsent
              checked={values.hasAcceptedDataPolicy}
              onChange={toggleDataPolicy}
              error={errors.hasAcceptedDataPolicy}
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