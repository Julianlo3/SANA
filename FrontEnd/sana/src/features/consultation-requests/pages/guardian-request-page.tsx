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
import AvailableSlotsList from "../components/available-slots-list";
import {
  COLOMBIA_DEPARTMENTS,
  NO_ZONE_REPORTED_LABEL,
} from "@/config/residence-zones";
import DataPolicyConsent from "../components/data-policy-consent";
import { useConsultationRequestForm } from "../hooks/use-consultation-request-form";
import {
  validateFullName,
  validateIdentityDocument,
  validateRelationship,
  validateEmail,
  validatePhone,
  validateMinorBirthDate,
  validateMinorIdentityDocument,
  validateGender,
} from "../validation/consultation-request-validation";
import type { Gender, GuardianRelationship } from "../types/consultation-request-types";

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

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Hombre" },
  { value: "female", label: "Mujer" },
  { value: "other", label: "Otro" },
  { value: "preferNotToSay", label: "No quiero especificar" },
];

export default function GuardianRequestPage() {
  const [step, setStep] = useState<1 | 2>(1);

  const {
    values,
    errors,
    isSaving,
    submitError,
    slots,
    areSlotsLoading,
    selectedSlotId,
    setSelectedSlotId,
    setValue,
    setFieldTouched,
    setRelationship,
    setMinorGender,
    toggleGuardianDataPolicy,
    toggleMinorDataPolicy,
    send,
  } = useConsultationRequestForm("guardian");

  function goToStep2() {
    const step1Errors = [
      validateFullName(values.fullName),
      validateIdentityDocument(values.identityDocument),
      validateRelationship(values.relationship),
      validateEmail(values.email),
      validatePhone(values.phone),
      validateFullName(values.minorFullName),
      validateMinorBirthDate(values.minorBirthDate),
      validateMinorIdentityDocument(values.minorIdentityDocument),
      validateGender(values.minorGender),
    ];

    setFieldTouched("fullName");
    setFieldTouched("identityDocument");
    setFieldTouched("relationship");
    setFieldTouched("email");
    setFieldTouched("phone");
    setFieldTouched("minorFullName");
    setFieldTouched("minorBirthDate");
    setFieldTouched("minorIdentityDocument");
    setFieldTouched("minorGender");

    if (step1Errors.every((error) => !error)) {
      setStep(2);
    }
  }

  const canSubmit =
    values.hasAcceptedGuardianDataPolicy && values.hasAcceptedMinorDataPolicy;

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

                  <label className="block">
                    <span className="text-sm font-semibold text-text">
                      {guardianForm.fields.minorBirthDate}
                      <span className="text-danger" aria-hidden>
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      type="date"
                      value={values.minorBirthDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(event) =>
                        setValue("minorBirthDate", event.target.value)
                      }
                      onBlur={() => setFieldTouched("minorBirthDate")}
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {errors.minorBirthDate && (
                      <span role="alert" className="mt-1.5 block text-xs text-danger">
                        {errors.minorBirthDate}
                      </span>
                    )}
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-text">
                      Género del menor
                      <span className="text-danger" aria-hidden>
                        {" "}
                        *
                      </span>
                    </span>
                    <select
                      value={values.minorGender}
                      onChange={(event) =>
                        setMinorGender(event.target.value as Gender | "")
                      }
                      onBlur={() => setFieldTouched("minorGender")}
                      className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">Selecciona</option>
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.minorGender && (
                      <span role="alert" className="mt-1.5 block text-xs text-danger">
                        {errors.minorGender}
                      </span>
                    )}
                  </label>

                  <div>
                    <span className="flex items-center gap-2 text-sm font-medium text-text">
                      Tarjeta de identidad (opcional)
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={values.minorIdentityDocument}
                      onChange={(event) =>
                        setValue(
                          "minorIdentityDocument",
                          keepDigits(event.target.value),
                        )
                      }
                      onBlur={() => setFieldTouched("minorIdentityDocument")}
                      maxLength={10}
                      placeholder="Si aún no tiene, déjalo en blanco"
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {errors.minorIdentityDocument && (
                      <span role="alert" className="mt-1.5 block text-xs text-danger">
                        {errors.minorIdentityDocument}
                      </span>
                    )}
                  </div>
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

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-text">
                      {guardianForm.fields.residenceZone} (opcional)
                    </span>
                    <select
                      value={values.department}
                      onChange={(event) =>
                        setValue("department", event.target.value)
                      }
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
                      El departamento donde vive el menor.
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

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-text">
                  Horario de atención
                </legend>
                <p className="text-xs text-text-subtle">
                  Elige el horario que más le convenga al menor. Si ninguno
                  sirve, la solicitud queda registrada igual.
                </p>

                <AvailableSlotsList
                  slots={slots}
                  isLoading={areSlotsLoading}
                  selectedSlotId={selectedSlotId}
                  onSelect={setSelectedSlotId}
                />
              </fieldset>

              <div className="space-y-3">
                <DataPolicyConsent
                  checked={values.hasAcceptedGuardianDataPolicy}
                  onChange={toggleGuardianDataPolicy}
                  error={errors.hasAcceptedGuardianDataPolicy}
                  label="Autorizo el tratamiento de mis datos personales como tutor/acudiente conforme a la Política de Privacidad de la Fundación Dejando Huellas Felices."
                />

                <DataPolicyConsent
                  checked={values.hasAcceptedMinorDataPolicy}
                  onChange={toggleMinorDataPolicy}
                  error={errors.hasAcceptedMinorDataPolicy}
                  label="Autorizo el tratamiento de los datos personales del menor a mi cargo conforme a la Política de Privacidad de la Fundación Dejando Huellas Felices."
                />
              </div>

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
                <Button onClick={send} disabled={isSaving || !canSubmit}>
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