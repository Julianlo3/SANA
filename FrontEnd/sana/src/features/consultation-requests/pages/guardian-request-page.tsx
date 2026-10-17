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
import { VULNERABLE_POPULATION_OPTIONS } from "@/config/vulnerable-population";
import AppointmentModeField from "../components/appointment-mode-field";
import ConfirmedField from "../components/confirmed-field";
import DataPolicyConsent from "../components/data-policy-consent";
import ResidenceFields from "../components/residence-fields";
import { useConsultationRequestForm } from "../hooks/use-consultation-request-form";
import { scrollToFirstError } from "../lib/scroll-to-first-error";
import {
  calculateAge,
  validateFullName,
  validateIdentityDocument,
  validateConfirmIdentityDocument,
  validateDocumentType,
  validateAdultBirthDate,
  validateGender,
  validateRelationship,
  validateEmail,
  validateConfirmEmail,
  validatePhone,
  validateMinorBirthDate,
  validateMinorIdentityDocument,
  validateConfirmMinorIdentityDocument,
  type RequestFormValues,
} from "../validation/consultation-request-validation";
import type {
  CardType,
  Gender,
  GuardianRelationshipId,
} from "../types/consultation-request-types";

const { guardianForm } = REQUEST_CONTENT;

/**
 * Las 4 opciones reales de la tabla relationship
 * (DataBase/init-scripts/02-inserts.sql). No hay "hermano/a" ni "otro":
 * el backend rechaza cualquier id que no esté en esa tabla.
 */
const RELATIONSHIP_OPTIONS: { value: GuardianRelationshipId; label: string }[] = [
  { value: 1, label: "Madre" },
  { value: 2, label: "Padre" },
  { value: 3, label: "Tío/a" },
  { value: 4, label: "Abuelo/a" },
];

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

/** Campos del paso 1: los del acudiente y los del menor. */
const STEP1_FIELDS: (keyof RequestFormValues)[] = [
  "fullName",
  "documentType",
  "identityDocument",
  "confirmIdentityDocument",
  "birthDate",
  "gender",
  "relationship",
  "email",
  "confirmEmail",
  "phone",
  "minorFullName",
  "minorBirthDate",
  "minorIdentityDocument",
  "confirmMinorIdentityDocument",
  "minorGender",
];

/** Nombres de los campos del paso 1 que hoy tienen error, para el resumen. */
function getStep1Failed(values: RequestFormValues): string[] {
  const checks: [string, string | undefined][] = [
    ["Nombre completo", validateFullName(values.fullName)],
    ["Tipo de documento", validateDocumentType(values.documentType)],
    ["Número de documento", validateIdentityDocument(values.identityDocument)],
    [
      "Confirmación del documento",
      validateConfirmIdentityDocument(
        values.identityDocument,
        values.confirmIdentityDocument,
      ),
    ],
    ["Tu fecha de nacimiento", validateAdultBirthDate(values.birthDate)],
    ["Tu género", validateGender(values.gender)],
    ["Parentesco", validateRelationship(values.relationship)],
    ["Correo", validateEmail(values.email)],
    [
      "Confirmación del correo",
      validateConfirmEmail(values.email, values.confirmEmail),
    ],
    ["Teléfono", validatePhone(values.phone)],
    ["Nombre del menor", validateFullName(values.minorFullName)],
    [
      "Fecha de nacimiento del menor",
      validateMinorBirthDate(values.minorBirthDate),
    ],
    [
      "Documento del menor",
      validateMinorIdentityDocument(values.minorIdentityDocument),
    ],
    [
      "Confirmación del documento del menor",
      validateConfirmMinorIdentityDocument(
        values.minorIdentityDocument,
        values.confirmMinorIdentityDocument,
      ),
    ],
    ["Género del menor", validateGender(values.minorGender)],
  ];

  return checks.filter(([, error]) => error).map(([label]) => label);
}

export default function GuardianRequestPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Attempted, setStep1Attempted] = useState(false);

  const {
    values,
    errors,
    errorSummary,
    isSaving,
    submitError,
    setValue,
    setFieldTouched,
    setRelationship,
    setDocumentType,
    setGender,
    setMinorGender,
    setAppointmentMode,
    toggleGuardianDataPolicy,
    toggleMinorDataPolicy,
    send,
  } = useConsultationRequestForm("dependent");

  const step1Failed = step1Attempted ? getStep1Failed(values) : [];
  const summary =
    step === 1 && step1Failed.length > 0 ? step1Failed : errorSummary;

  function goToStep2() {
    STEP1_FIELDS.forEach((field) => setFieldTouched(field));
    setStep1Attempted(true);

    if (getStep1Failed(values).length === 0) {
      setStep(2);
      return;
    }

    window.setTimeout(scrollToFirstError, 50);
  }

  /** Envía y, si el backend rechaza un dato del paso 1, vuelve a ese paso. */
  async function handleSend() {
    const rejected = await send();

    if (rejected.some((field) => STEP1_FIELDS.includes(field))) {
      setStep(1);
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
                    label={guardianForm.fields.identityDocument}
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
                      Tu fecha de nacimiento{" "}
                      <span className="text-danger" aria-hidden>
                        *
                      </span>
                    </span>
                    <input
                      type="date"
                      value={values.birthDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(event) =>
                        setValue("birthDate", event.target.value)
                      }
                      onBlur={() => setFieldTouched("birthDate")}
                      aria-invalid={errors.birthDate ? true : undefined}
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <span className="mt-1.5 block text-xs text-text-subtle">
                      Debes ser mayor de edad para solicitar la cita.
                    </span>
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

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label={guardianForm.fields.phone}
                    required
                    type="tel"
                    inputMode="numeric"
                    value={values.phone}
                    error={errors.phone}
                    maxLength={12}
                    onChange={(value) => setValue("phone", keepDigits(value))}
                    onBlur={() => setFieldTouched("phone")}
                  />

                  <label className="block">
                    <span className="text-sm font-semibold text-text">
                      {guardianForm.fields.relationship}{" "}
                      <span className="text-danger" aria-hidden>
                        *
                      </span>
                    </span>
                    <select
                      value={values.relationship}
                      onChange={(event) =>
                        setRelationship(
                          event.target.value === ""
                            ? ""
                            : (Number(
                                event.target.value,
                              ) as GuardianRelationshipId),
                        )
                      }
                      onBlur={() => setFieldTouched("relationship")}
                      aria-invalid={errors.relationship ? true : undefined}
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

                <ConfirmedField
                  label={guardianForm.fields.email}
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
                      {guardianForm.fields.minorBirthDate}{" "}
                      <span className="text-danger" aria-hidden>
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
                      aria-invalid={errors.minorBirthDate ? true : undefined}
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
                      Género del menor{" "}
                      <span className="text-danger" aria-hidden>
                        *
                      </span>
                    </span>
                    <select
                      value={values.minorGender}
                      onChange={(event) =>
                        setMinorGender(event.target.value as Gender | "")
                      }
                      onBlur={() => setFieldTouched("minorGender")}
                      aria-invalid={errors.minorGender ? true : undefined}
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
                      {values.minorBirthDate &&
                      calculateAge(values.minorBirthDate) >= 7
                        ? "Tarjeta de identidad"
                        : "Registro civil de nacimiento (NUIP)"}
                      <span className="text-danger" aria-hidden>
                        *
                      </span>
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
                      aria-invalid={errors.minorIdentityDocument ? true : undefined}
                      maxLength={12}
                      placeholder="Solo números"
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {errors.minorIdentityDocument && (
                      <span role="alert" className="mt-1.5 block text-xs text-danger">
                        {errors.minorIdentityDocument}
                      </span>
                    )}
                  </div>
                </div>

                <TextField
                  label="Confirma el documento del menor"
                  required
                  inputMode="numeric"
                  value={values.confirmMinorIdentityDocument}
                  error={errors.confirmMinorIdentityDocument}
                  maxLength={12}
                  placeholder="Escríbelo de nuevo"
                  onChange={(value) =>
                    setValue("confirmMinorIdentityDocument", keepDigits(value))
                  }
                  onBlur={() => setFieldTouched("confirmMinorIdentityDocument")}
                />

                <label className="block">
                  <span className="text-sm font-medium text-text">
                    ¿El menor pertenece a alguna población vulnerable?
                    (opcional)
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
                    Esta información es opcional y nos ayuda a orientar mejor
                    la atención.
                  </span>
                </label>
              </fieldset>

              <p className="flex items-start gap-2 text-xs leading-relaxed text-text-subtle">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
                {guardianForm.privacyNote}
              </p>

              {summary.length > 0 && (
                <InlineMessage tone="error">
                  Revisa estos campos: {summary.join(", ")}.
                </InlineMessage>
              )}
            </div>
          ) : (
            <div className="mt-8 space-y-8 rounded-2xl border border-border bg-surface p-6">
              <fieldset className="space-y-5">
                <legend className="text-sm font-semibold text-text">
                  {guardianForm.sections.detail}
                </legend>

                <ResidenceFields
                  department={values.department}
                  municipality={values.municipality}
                  municipalityError={errors.municipality}
                  helperText="El departamento donde vive el menor."
                  onDepartmentChange={(value) => {
                    setValue("department", value);
                    setValue("municipality", "");
                  }}
                  onMunicipalityChange={(value) => setValue("municipality", value)}
                  onMunicipalityBlur={() => setFieldTouched("municipality")}
                />

                <AppointmentModeField
                  value={values.appType}
                  error={errors.appType}
                  onChange={setAppointmentMode}
                  onBlur={() => setFieldTouched("appType")}
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
                    maxLength={1000}
                    aria-invalid={errors.consultationReason ? true : undefined}
                    placeholder="Opcional. Esta información nos ayuda a orientar al profesional más adecuado."
                    className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {errors.consultationReason && (
                    <span role="alert" className="mt-1.5 block text-xs text-danger">
                      {errors.consultationReason}
                    </span>
                  )}
                </label>

                <p className="rounded-xl bg-primary-soft/40 p-4 text-sm text-text-muted">
                  Una vez enviada la solicitud, se asignará una cita en el
                  menor tiempo posible. Te contactaremos por correo o teléfono
                  para confirmar la fecha y hora.
                </p>
              </fieldset>

              <div className="space-y-3">
                <DataPolicyConsent
                  checked={values.hasAcceptedGuardianDataPolicy}
                  onChange={toggleGuardianDataPolicy}
                  error={errors.hasAcceptedGuardianDataPolicy}
                  policyType="data_treatment"
                  label="Autorizo el tratamiento de mis datos personales como tutor/acudiente."
                />

                <DataPolicyConsent
                  checked={values.hasAcceptedMinorDataPolicy}
                  onChange={toggleMinorDataPolicy}
                  error={errors.hasAcceptedMinorDataPolicy}
                  policyType="dependent_consent"
                  label="Autorizo el tratamiento de los datos personales del menor a mi cargo."
                />
              </div>

              {summary.length > 0 && (
                <InlineMessage tone="error">
                  Revisa estos campos: {summary.join(", ")}.
                </InlineMessage>
              )}

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
                <Button onClick={handleSend} disabled={isSaving}>
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