"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import PageDecor from "@/components/ui/page-decor";
import PublicHeader from "@/components/navigation/public-header";
import PublicFooter from "@/components/navigation/public-footer";
import { REQUEST_CONTENT } from "@/content/consultation-request";

const { success } = REQUEST_CONTENT;

const APPOINTMENT_DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const APPOINTMENT_TIME_FORMAT = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
});

/** Pantalla de éxito tras enviar la solicitud (HU-2.2.2, 2.2.10 y 2.2.11). */
export default function RequestConfirmationPage() {
  const searchParams = useSearchParams();
  const referenceNumber = searchParams.get("radicado");
  const isConfirmed = searchParams.get("asignada") === "true";
  const scheduledAt = searchParams.get("horario");
  const psychologistName = searchParams.get("psicologo");

  const title = isConfirmed ? success.confirmedTitle : success.title;

    let description: string = success.description;
  if (isConfirmed && scheduledAt) {
    const date = new Date(scheduledAt);
    const formattedDate = `${APPOINTMENT_DATE_FORMAT.format(date)} a las ${APPOINTMENT_TIME_FORMAT.format(date)}`;

    description = `${success.confirmedDescriptionPrefix} ${formattedDate}${
      psychologistName ? `, con ${psychologistName}` : ""
    }${success.confirmedDescriptionSuffix}`;
  }

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="relative flex-1 overflow-hidden">
        <PageDecor variant="auth" />

        <div className="relative z-10 mx-auto max-w-md px-6 py-20 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <CheckCircle2 size={32} aria-hidden />
          </span>

          <h1 className="mt-6 font-display text-3xl font-extrabold text-primary-dark">
            {title}
          </h1>

          <p className="mt-4 leading-relaxed text-text-muted">
            {description}
          </p>

          {referenceNumber && (
            <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                {success.referenceLabel}
              </p>
              <p className="mt-2 font-display text-2xl font-bold tracking-wide text-primary">
                {referenceNumber}
              </p>
              <p className="mt-2 text-xs text-text-subtle">
                {success.referenceHint}
              </p>
            </div>
          )}

          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            <ArrowLeft size={16} aria-hidden />
            {success.backHome}
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}