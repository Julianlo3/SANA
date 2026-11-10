"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquareQuote } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import { ASSISTANT_SCRIPT } from "@/content/legal";
import { keepDigits } from "@/lib/format/text";
import { ApiError } from "@/types/api-types";
import {
  validateBirthDate,
  validateEmail,
  validateFullName,
  validateGender,
  validateIdentityDocument,
  validatePhone,
} from "@/features/consultation-requests/validation/consultation-request-validation";
import { createConsultant } from "../services/consultants-service";
import type {
  AssistedConsentChannel,
  CreateConsultantPayload,
} from "../types/consultant-types";

/**
 * Defines the values type.
 */
type Values = {
  fullName: string;
  cardType: CreateConsultantPayload["cardType"];
  identityDocument: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: CreateConsultantPayload["gender"] | "";
  consentGiven: boolean;
  channel: AssistedConsentChannel | "";
};

/**
 * Defines the initial consultant form values.
 */
const EMPTY: Values = {
  fullName: "",
  cardType: "CC",
  identityDocument: "",
  email: "",
  phone: "",
  birthdate: "",
  gender: "",
  consentGiven: false,
  channel: "",
};

/**
 * Defines the card types.
 */
const CARD_TYPES: { value: CreateConsultantPayload["cardType"]; label: string }[] = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "TI", label: "Tarjeta de identidad" },
];

/**
 * Defines the genders.
 */
const GENDERS: { value: CreateConsultantPayload["gender"]; label: string }[] = [
  { value: "M", label: "Hombre" },
  { value: "F", label: "Mujer" },
  { value: "O", label: "Otro" },
  { value: "P", label: "No quiere especificar" },
];

/**
 * Defines the channels.
 */
const CHANNELS: { value: AssistedConsentChannel; label: string }[] = [
  { value: "telefono", label: "Teléfono" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "presencial", label: "Presencial" },
];

/**
 * Defines the phone max digits.
 */
const PHONE_MAX_DIGITS = 10;

/**
 * Defines the select class.
 */
const SELECT_CLASS =
  "mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40";

/**
 * Validates the consultant creation form.
 * @param values Value to process.
 * @returns Rendered component.
 */
function validate(values: Values) {
  return {
    fullName: validateFullName(values.fullName),
    identityDocument: validateIdentityDocument(values.identityDocument),
    email: validateEmail(values.email),
    phone:
      validatePhone(values.phone) ??
      (values.phone.length > PHONE_MAX_DIGITS
        ? `El número debe tener máximo ${PHONE_MAX_DIGITS} dígitos.`
        : undefined),
    birthdate: validateBirthDate(values.birthdate, "la fecha de nacimiento"),
    gender: validateGender(values.gender),
    consentGiven: values.consentGiven
      ? undefined
      : "La persona debe autorizar el tratamiento de sus datos antes de registrarla.",
    channel: values.channel ? undefined : "Selecciona el canal por el que autorizó.",
  };
}

/**
 * Lets the assistant register a consultant who requested care by phone,
 * WhatsApp or in person, recording the verbal consent and its channel
 * (FDHF-WEB-AV-01, section 8).
 */
export default function ConsultantCreatePage() {
  const router = useRouter();
  const [values, setValues] = useState<Values>(EMPTY);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => validate(values), [values]);
  const visible = (field: keyof typeof errors) =>
    wasSubmitted ? errors[field] : undefined;

  const setValue = <K extends keyof Values>(field: K, value: Values[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const submit = async () => {
    setWasSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;

    setIsSaving(true);
    setSubmitError(null);
    try {
      const created = await createConsultant({
        fullName: values.fullName.trim(),
        cardType: values.cardType,
        identityDocument: values.identityDocument.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        birthdate: values.birthdate,
        gender: values.gender as CreateConsultantPayload["gender"],
        termsAccepted: values.consentGiven,
        channel: values.channel as AssistedConsentChannel,
      });
      router.push(`/consultantes/${created.id}/resumen`);
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No pudimos registrar la ficha. Intenta de nuevo en unos minutos.",
      );
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/consultantes"
        className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden />
        Volver
      </Link>

      <h1 className="mt-4 font-display text-3xl font-bold text-primary-dark">
        Registrar consultante
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Para personas que pidieron atención por teléfono, WhatsApp o en persona.
      </p>

      <aside className="mt-6 rounded-2xl border border-primary/30 bg-primary-soft/40 p-5 text-sm leading-relaxed text-text">
        <p className="flex items-center gap-2 font-semibold text-primary-dark">
          <MessageSquareQuote size={18} aria-hidden />
          {ASSISTANT_SCRIPT.title}
        </p>
        <p className="mt-3 italic">“{ASSISTANT_SCRIPT.text}”</p>
        <p className="mt-3 text-xs text-text-muted">{ASSISTANT_SCRIPT.whatsappNote}</p>
      </aside>

      <div className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6">
        <TextField
          label="Nombre completo"
          required
          value={values.fullName}
          error={visible("fullName")}
          maxLength={100}
          onChange={(value) => setValue("fullName", value)}
        />

        <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
          <label className="block">
            <span className="text-sm font-semibold text-text">Tipo de documento</span>
            <select
              value={values.cardType}
              onChange={(event) =>
                setValue("cardType", event.target.value as Values["cardType"])
              }
              className={SELECT_CLASS}
            >
              {CARD_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <TextField
            label="Número de documento"
            required
            inputMode="numeric"
            value={values.identityDocument}
            error={visible("identityDocument")}
            maxLength={12}
            onChange={(value) => setValue("identityDocument", keepDigits(value))}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Correo electrónico"
            required
            type="email"
            inputMode="email"
            value={values.email}
            error={visible("email")}
            maxLength={100}
            onChange={(value) => setValue("email", value)}
          />

          <TextField
            label="Teléfono"
            required
            type="tel"
            inputMode="numeric"
            value={values.phone}
            error={visible("phone")}
            maxLength={PHONE_MAX_DIGITS}
            onChange={(value) => setValue("phone", keepDigits(value))}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-text">
              Fecha de nacimiento{" "}
              <span className="text-danger" aria-hidden>
                *
              </span>
            </span>
            <input
              type="date"
              value={values.birthdate}
              onChange={(event) => setValue("birthdate", event.target.value)}
              aria-invalid={visible("birthdate") ? true : undefined}
              className={SELECT_CLASS}
            />
            {visible("birthdate") && (
              <span role="alert" className="mt-1.5 block text-xs text-danger">
                {visible("birthdate")}
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
                setValue("gender", event.target.value as Values["gender"])
              }
              aria-invalid={visible("gender") ? true : undefined}
              className={SELECT_CLASS}
            >
              <option value="">Selecciona</option>
              {GENDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {visible("gender") && (
              <span role="alert" className="mt-1.5 block text-xs text-danger">
                {visible("gender")}
              </span>
            )}
          </label>
        </div>

        <fieldset className="space-y-4 border-t border-border pt-5">
          <legend className="text-sm font-semibold text-text">
            Autorización de datos
          </legend>

          <label className="block">
            <span className="text-sm font-semibold text-text">
              Canal por el que autorizó{" "}
              <span className="text-danger" aria-hidden>
                *
              </span>
            </span>
            <select
              value={values.channel}
              onChange={(event) =>
                setValue("channel", event.target.value as Values["channel"])
              }
              aria-invalid={visible("channel") ? true : undefined}
              className={SELECT_CLASS}
            >
              <option value="">Selecciona el canal</option>
              {CHANNELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {visible("channel") && (
              <span role="alert" className="mt-1.5 block text-xs text-danger">
                {visible("channel")}
              </span>
            )}
          </label>

          <div>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                visible("consentGiven")
                  ? "border-danger bg-danger-soft/40"
                  : "border-border bg-surface"
              }`}
            >
              <input
                type="checkbox"
                checked={values.consentGiven}
                onChange={(event) => setValue("consentGiven", event.target.checked)}
                aria-invalid={visible("consentGiven") ? true : undefined}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-sm text-text">
                <span className="font-semibold">Autorización verbal informada.</span>{" "}
                <span className="text-text-muted">
                  Leí el guion a la persona y autorizó el tratamiento de sus datos.
                </span>
              </span>
            </label>
            {visible("consentGiven") && (
              <span role="alert" className="mt-2 block text-xs text-danger">
                {visible("consentGiven")}
              </span>
            )}
          </div>
        </fieldset>

        {submitError && <InlineMessage tone="error">{submitError}</InlineMessage>}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/consultantes"
          className="rounded-full border border-border bg-surface px-6 py-3 text-center text-sm font-semibold text-text-muted transition hover:border-primary hover:text-primary"
        >
          Cancelar
        </Link>
        <Button onClick={submit} disabled={isSaving}>
          {isSaving ? "Registrando…" : "Registrar consultante"}
        </Button>
      </div>
    </div>
  );
}
