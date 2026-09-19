"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import PageDecor from "@/components/ui/page-decor";
import PublicHeader from "@/components/navigation/public-header";
import PublicFooter from "@/components/navigation/public-footer";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import { REQUEST_CONTENT } from "@/content/consultation-request";
import { keepDigits } from "@/lib/format/text";
import DataPolicyConsent from "../components/data-policy-consent";
import ResidenceZoneSelect from "../components/residence-zone-select";
import { useConsultationRequestForm } from "../hooks/use-consultation-request-form";
import {
  validateFullName,
  validateIdentityDocument,
  validateRelationship,
  validateEmail,
  validatePhone,
  validateMinorBirthDate,
} from "../validation/consultation-request-validation";
import type { GuardianRelationship } from "../types/consultation-request-types";

const { guardianForm } = REQUEST_CONTENT;

const RELATIONSHIP_OPTIONS: { value: GuardianRelationship; label: string }[] = [
  { value: "mother", label: "Madre" },
  { value: "father", label: "Padre" },
  { value: "grandparent", label: "Abuelo/a" },
  { value: "sibling", label: "Hermano/a" },
  { value: "uncleAunt", label: "Tío/a" },
  { value: "legalGuardian", label: "Tutor legal designado" },
  { value: "other", label: "Otro" },
];

/**
 * HU-2.2: formulario del tutor legal, en dos pasos.
 * Paso 1: identificación del tutor y del menor.
 * Paso 2: zona de residencia, motivo y autorización de datos.
 */
export default function GuardianRequestPage() {
  const [step, setStep] = useState<1 | 2>(1);

  const {
    values,
    errors,
    isSaving,
    submitError,
    setValue,
    setFieldTouched,
    setRelationship,
    toggleDataPolicy,
    send,
  } = useConsultationRequestForm("guardian");

  /** Valida solo los campos del paso 1 antes de avanzar. */
  function goToStep2() {
    const step1Errors = [
      validateFullName(values.fullName),
      validateIdentityDocument(values.identityDocument),
      validateRelationship(values.relationship),
      validateEmail(values.email),
      validatePhone(values.phone),
      validateFullName(values.minorFullName),
      validateMinorBirthDate(values.minorBirthDate),
    ];

    setFieldTouched("fullName");
    setFieldTouched("identityDocument");
    setFieldTouched("relationship");
    setFieldTouched("email");
    setFieldTouched("phone");
    setFieldTouched("minorFullName");
    setFieldTouched("minorBirthDate");

    if (step1Errors.every((error) => !error)) {
      setStep(2);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="relative flex-1 overflow-hidden">
        <PageDecor variant="auth" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-16">
          <Link
            href="/solicitar-cita"
            className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-primary"
          >
            <ArrowLeft size={16} aria-hidden />
            Volver
          </Link>

          {/* Indicador de paso */}
          <div className="mt-6 flex items-center gap-3">
            {guardianForm.steps.map((label, index) => {
              const stepNumber = (index + 1) as 1 | 2;
              const isActive = stepNumber === step;
              const isDone = stepNumber < step;

              return (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isActive || isDone
                        ? "bg-primary text-white"
                        : "bg-surface-muted text-text-subtle"
                    }`}
                  >
                    {stepNumber}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isActive ? "text-primary" : "text-text-subtle"
                    }`}
                  >
                    {label}
                  </span>
                  {stepNumber === 1 && (
                    <span className="h-px w-8 bg-border" aria-hidden />
                  )}
                </div>
              );
            })}
          </div>

          <h1 className="mt-6 font-display text-3xl font-extrabold text-primary-dark sm:text-4xl">
            {guardianForm.title}
          </h1>

          <p className="mt-3 text-sm text-text-muted">
            {guardianForm.description}
          </p>

          {step === 1 ? (
            <div className="mt-8 space-y-8 rounded-2xl border border-border bg-surface p-6">
              <fieldset className="space-y-5">
                <legend className="text-sm font-semibold text-text">
                  {guardianForm.sections.guardian}
                </legend>

                <TextField
                  label={guardianForm.fields.fullName}
                  required
                  value={values.fullName}
                  error={errors.fullName}
                  maxLength={100}
                  onChange={(value) => setValue("fullName", value)}
                  onBlur={() => setFieldTouched("fullName")}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label={guardianForm.fields.identityDocument}
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

                  <label className="block">
                    <span className="text-sm font-semibold text-text">
                      {guardianForm.fields.relationship}
                      <span className="text-danger" aria-hidden>
                        {" "}
                        *
                      </span>
                    </span>
                    <select
                      value={values.relationship}
                      onChange={(event) =>
                        setRelationship(
                          event.target.value as GuardianRelationship | "",
                        )
                      }
                      onBlur={() => setFieldTouched("relationship")}
                      className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">Selecciona una opción</option>
                      {RELATIONSHIP_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.relationship && (
                      <span role="alert" className="mt-1.5 block text-xs text-danger">
                        {errors.relationship}
                      </span>
                    )}
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label={guardianForm.fields.phone}
                    required
                    type="tel"
                    inputMode="numeric"
                    value={values.phone}
                    error={errors.phone}
                    maxLength={10}
                    onChange={(value) => setValue("phone", keepDigits(value))}
                    onBlur={() => setFieldTouched("phone")}
                  />

                  <TextField
                    label={guardianForm.fields.email}
                    required
                    type="email"
                    inputMode="email"
                    value={values.email}
                    error={errors.email}
                    onChange={(value) => setValue("email", value)}
                    onBlur={() => setFieldTouched("email")}
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-5">
                <legend className="text-sm font-semibold text-text">
                  {guardianForm.sections.minor}
                </legend>

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label={guardianForm.fields.minorFullName}
                    required
                    value={values.minorFullName}
                    error={errors.minorFullName}
                    maxLength={100}
                    onChange={(value) => setValue("minorFullName", value)}
                    onBlur={() => setFieldTouched("minorFullName")}
                  />

                  <TextField
                    label={guardianForm.fields.minorBirthDate}
                    required
                    placeholder="AAAA-MM-DD"
                    value={values.minorBirthDate}
                    error={errors.minorBirthDate}
                    onChange={(value) => setValue("minorBirthDate", value)}
                    onBlur={() => setFieldTouched("minorBirthDate")}
                  />
                </div>
              </fieldset>

              <p className="flex items-start gap-2 text-xs leading-relaxed text-text-subtle">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
                {guardianForm.privacyNote}
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-8 rounded-2xl border border-border bg-surface p-6">
              <fieldset className="space-y-5">
                <legend className="text-sm font-semibold text-text">
                  {guardianForm.sections.detail}
                </legend>

                <ResidenceZoneSelect
                  label={guardianForm.fields.residenceZone}
                  value={values.residenceZoneId}
                  onChange={(value) => setValue("residenceZoneId", value)}
                />

                <label className="block">
                  <span className="text-sm font-medium text-text">
                    {guardianForm.fields.consultationReason}
                  </span>
                  <textarea
                    value={values.consultationReason}
                    onChange={(event) =>
                      setValue("consultationReason", event.target.value)
                    }
                    rows={4}
                    maxLength={500}
                    placeholder="Opcional. Esta información nos ayuda a orientar al profesional más adecuado."
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
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {step === 1 ? (
              <Button onClick={goToStep2}>{guardianForm.nextStep}</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setStep(1)}>
                  {guardianForm.previousStep}
                </Button>
                <Button onClick={send} disabled={isSaving}>
                  {isSaving ? "Enviando…" : guardianForm.submit}
                </Button>
              </>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}