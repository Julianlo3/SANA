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
import DataPolicyConsent from "../components/data-policy-consent";
import ResidenceZoneSelect from "../components/residence-zone-select";
import { useConsultationRequestForm } from "../hooks/use-consultation-request-form";

const { selfForm } = REQUEST_CONTENT;

/** HU-2.2: formulario de quien solicita la atención para sí mismo. */
export default function SelfRequestPage() {
  const {
    values,
    errors,
    isSaving,
    submitError,
    receipt,
    setValue,
    setFieldTouched,
    toggleDataPolicy,
    send,
  } = useConsultationRequestForm("self");

   if (receipt) {
    return null; // El hook padre redirige a la confirmación; ver nota abajo.
  }
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

              <div className="grid gap-5 sm:grid-cols-2">
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

                <TextField
                  label={selfForm.fields.birthDate}
                  required
                  type="text"
                  value={values.birthDate}
                  error={errors.birthDate}
                  placeholder="AAAA-MM-DD"
                  onChange={(value) => setValue("birthDate", value)}
                  onBlur={() => setFieldTouched("birthDate")}
                />
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

              <ResidenceZoneSelect
                label={selfForm.fields.residenceZone}
                value={values.residenceZoneId}
                onChange={(value) => setValue("residenceZoneId", value)}
              />
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