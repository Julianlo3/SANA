"use client";

import {
  Activity,
  HeartHandshake,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import PageDecor from "@/components/ui/page-decor";
import { useReportsSummary } from "../hooks/use-reports-summary";
import type { ReportsSummary } from "../types/report-types";

/**
 * Display data for one aggregate report metric.
 */
type Metric = {
  label: string;
  value: string;
  detail: string;
};

/**
 * Report category and the metrics shown in its section.
 */
type ReportSection = {
  title: string;
  description: string;
  icon: typeof Activity;
  metrics: Metric[];
};

/**
 * Colombian number formatter shared by numeric report metrics.
 */
const numberFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 1,
});

/**
 * Formats a numeric report value using the Colombian locale.
 * @param value Numeric value from the report response.
 * @returns A localized number string.
 */
function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/**
 * Formats a donation amount, which the API returns in centavos.
 * @param amountCents Amount represented as a decimal integer string.
 * @returns A localized COP amount with no fractional pesos.
 */
function formatDonationAmount(amountCents: string): string {
  const cents = BigInt(amountCents);
  const hundred = BigInt(100);
  const pesos =
    cents / hundred + (cents % hundred >= BigInt(50) ? BigInt(1) : BigInt(0));
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(pesos);
}

/**
 * Maps the API response into report sections ready for display.
 * @param summary Aggregate metrics returned by the reports endpoint.
 * @returns The report sections and their presentation metadata.
 */
function createReportSections(summary: ReportsSummary): ReportSection[] {
  return [
    {
      title: "Psicología",
      description: "Actividad de atención y capacidad profesional.",
      icon: Activity,
      metrics: [
        {
          label: "Citas realizadas",
          value: formatNumber(summary.psychology.totalCompletedAppointments),
          detail: "Total registrado en el sistema",
        },
        {
          label: "Promedio por psicólogo activo",
          value: formatNumber(
            summary.psychology
              .averageCompletedAppointmentsPerPsychologist,
          ),
          detail: "Citas realizadas por profesional",
        },
        {
          label: "Psicólogos activos",
          value: formatNumber(summary.psychology.activePsychologists),
          detail: "Cuentas profesionales activas",
        },
      ],
    },
    {
      title: "Sistema",
      description: "Indicadores generales de consultantes.",
      icon: UsersRound,
      metrics: [
        {
          label: "Consultantes activos",
          value: formatNumber(summary.system.totalConsultants),
          detail: "Cuentas de consultantes activas",
        },
        {
          label: "Promedio de citas por consultante",
          value: formatNumber(summary.system.averageAppointmentsPerConsultant),
          detail: "Citas realizadas por consultante",
        },
      ],
    },
    {
      title: "Donaciones",
      description: "Aportes aprobados y participación de donantes.",
      icon: HeartHandshake,
      metrics: [
        {
          label: "Monto aprobado",
          value: formatDonationAmount(summary.donations.totalAmountInCents),
          detail: "Valor acumulado de donaciones aprobadas",
        },
        {
          label: "Donaciones aprobadas",
          value: formatNumber(summary.donations.approvedDonations),
          detail: "Transacciones aprobadas",
        },
        {
          label: "Personas donantes",
          value: formatNumber(summary.donations.peopleWhoDonated),
          detail: "Donantes con aportes aprobados",
        },
      ],
    },
  ];
}

/**
 * Renders an individual report metric.
 * @param props Metric label, value, and supporting detail.
 * @returns A responsive metric card.
 */
function MetricCard({ label, value, detail }: Metric) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm font-medium text-text-muted">{label}</p>
      <p className="mt-3 break-words font-display text-3xl font-bold text-primary">
        {value}
      </p>
      <p className="mt-2 text-xs text-text-subtle">{detail}</p>
    </article>
  );
}

/**
 * Administrator dashboard for the available aggregate reports.
 * @returns The reports dashboard interface.
 */
export default function ReportsDashboardPage() {
  const { summary, isLoading, error, refresh } = useReportsSummary();
  const sections = summary ? createReportSections(summary) : [];

  return (
    <>
      <PageDecor />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl">
              Reportes
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Indicadores agregados de atención, consultantes y donaciones.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              size={16}
              aria-hidden
              className={isLoading ? "animate-spin" : ""}
            />
            Actualizar
          </button>
        </div>

        {error && (
          <div className="mt-6">
            <InlineMessage tone="error">{error}</InlineMessage>
            {!summary && (
              <button
                type="button"
                onClick={refresh}
                className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {isLoading && !summary ? (
          <p
            role="status"
            className="mt-8 rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle"
          >
            Cargando reportes…
          </p>
        ) : (
          <div className="mt-8 space-y-8" aria-busy={isLoading}>
            {sections.map(({ title, description, icon: Icon, metrics }) => (
              <section key={title} aria-labelledby={`report-${title}`}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon size={20} aria-hidden />
                  </span>
                  <div>
                    <h2
                      id={`report-${title}`}
                      className="font-display text-xl font-bold text-primary-dark"
                    >
                      {title}
                    </h2>
                    <p className="text-sm text-text-muted">{description}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {metrics.map((metric) => (
                    <MetricCard key={metric.label} {...metric} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
