"use client";

import { useState } from "react";
import {
  Activity,
  CalendarDays,
  HeartHandshake,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import PageDecor from "@/components/ui/page-decor";
import { useReportsDashboard } from "../hooks/use-reports-dashboard";
import {
  formatDateLabel,
  formatMoney,
  formatNumber,
  formatNumberWithTwoDecimals,
  formatPercent,
  formatSignedPercent,
  humanizeToken,
} from "../lib/report-format";
import {
  buildDonorDonationSummary,
  getDonorFilterOptions,
} from "../lib/donation-donor-summary";
import { buildMonthlyDonationTrend } from "../lib/donation-monthly-trend";
import type {
  AttendanceReport,
  AppointmentsEvolutionReport,
  DonationsEvolutionReport,
  DonationsHistoryReport,
  GeneralManagementReport,
  ReportPeriod,
  ReportPreset,
  ReportQuery,
  ReportResponse,
} from "../types/report-types";
import {
  BreakdownBars,
  ChartCard,
  MetricGrid,
  ReportTable,
  type ReportMetric,
  type ReportTableRow,
  TrendChart,
  VerticalBreakdownBars,
} from "../components/report-visualizations";

type ReportKind = ReportResponse["kind"];
type ReportSection = "general" | "appointments" | "attendance" | "donations";
type DonationReportKind = Extract<
  ReportKind,
  "donations-history" | "donations-evolution"
>;
type PsychologistFilterOption = { id: number; name: string };
type PaymentMethodOption = { value: string; label: string };
type DonorFilterState = {
  donorKey: string;
  onDonorKeyChange: (donorKey: string) => void;
};

/**
 * Extracts selectable psychologists from an attendance report.
 * @param report Attendance report data.
 * @returns Psychologists with valid identifiers.
 */
function getPsychologistFilterOptions(
  report: AttendanceReport,
): PsychologistFilterOption[] {
  return report.byPsychologist.flatMap((psychologist) =>
    psychologist.psyId === null
      ? []
      : [{ id: psychologist.psyId, name: psychologist.psychologistName }],
  );
}

/**
 * Extracts unique payment methods from donation aggregates.
 * @param report Donation history report data.
 * @returns Available payment method options.
 */
function getPaymentMethodOptions(
  report: DonationsHistoryReport,
): PaymentMethodOption[] {
  const methods = new Map<string, PaymentMethodOption>();
  for (const item of report.byPaymentMethod) {
    const value = item.paymentMethod.trim();
    const normalized = value.toLocaleUpperCase("es-CO");
    if (!value || normalized === "SIN ESPECIFICAR" || methods.has(normalized)) {
      continue;
    }
    methods.set(normalized, { value, label: humanizeToken(value) });
  }
  return [...methods.values()];
}

const TABS: {
  kind: ReportSection;
  label: string;
  icon: typeof Activity;
}[] = [
  { kind: "general", label: "General", icon: Activity },
  { kind: "appointments", label: "Citas", icon: CalendarDays },
  { kind: "attendance", label: "Asistencia", icon: UsersRound },
  { kind: "donations", label: "Donaciones", icon: HeartHandshake },
];

const DONATION_TABS: { kind: DonationReportKind; label: string }[] = [
  { kind: "donations-history", label: "Historial" },
  { kind: "donations-evolution", label: "Evolución" },
];

const PRESETS: { value: ReportPreset; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "last_7_days", label: "Últimos 7 días" },
  { value: "last_month", label: "Últimos 30 días" },
  { value: "last_3_months", label: "Últimos 3 meses" },
  { value: "current_year", label: "Año actual" },
  { value: "custom", label: "Rango personalizado" },
];

const FIELD_CLASS =
  "mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40";

/**
 * Gets today's date in the report's Bogotá time zone.
 * @returns Current date as YYYY-MM-DD.
 */
function getTodayDate(): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

/**
 * Creates the default 30-day custom date range.
 * @returns Inclusive start and end dates.
 */
function getDefaultDates(): { startDate: string; endDate: string } {
  const endDate = getTodayDate();
  const start = new Date(`${endDate}T12:00:00`);
  start.setDate(start.getDate() - 29);
  const startParts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(start);
  const startValues = new Map(startParts.map((part) => [part.type, part.value]));
  return {
    startDate: `${startValues.get("year")}-${startValues.get("month")}-${startValues.get("day")}`,
    endDate,
  };
}

/**
 * Formats a timestamp for report tables in Bogotá time.
 * @param value Timestamp to format.
 * @returns Localized date and time, or an em dash if invalid.
 */
function getDateTimeLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(date);
}

/**
 * Formats a comparison percentage for metric details.
 * @param percentage Change against the previous period.
 * @returns Localized comparison text.
 */
function getComparisonDetail(percentage: number | null): string {
  return formatSignedPercent(percentage);
}

/**
 * Combines a currency difference with its period comparison.
 * @param differenceInCents Difference expressed in cents.
 * @param percentage Percentage change against the previous period.
 * @param currency ISO currency code.
 * @returns Formatted currency and comparison text.
 */
function getMoneyComparisonDetail(
  differenceInCents: string,
  percentage: number | null,
  currency = "COP",
): string {
  const difference = formatMoney(differenceInCents, currency);
  return `${difference} · ${getComparisonDetail(percentage)}`;
}

/**
 * Renders the shared summary metric grid.
 * @param metrics Metric values and details.
 * @returns Summary metric cards.
 */
function SummaryMetrics({ metrics }: { metrics: ReportMetric[] }) {
  return <MetricGrid metrics={metrics} />;
}

/**
 * Renders general report metrics and activity charts.
 * @param report General report response.
 * @returns General report content.
 */
function GeneralReportView({ report }: { report: GeneralManagementReport }) {
  const appointmentTimeline = report.timeline.filter(
    (item) => item.appointmentsCount > 0,
  );
  const metrics: ReportMetric[] = [
    {
      label: "Citas en el periodo",
      value: formatNumber(report.appointments.total),
      detail: getComparisonDetail(report.appointments.comparisonWithPrevious.percentage),
    },
    {
      label: "Citas realizadas",
      value: formatNumber(report.appointments.completed),
      detail: `${formatNumber(report.appointments.scheduled)} pendientes, asignadas o confirmadas`,
    },
    {
      label: "Nuevos registros",
      value: formatNumber(report.users.newRegistered),
      detail: getComparisonDetail(report.users.comparisonWithPrevious.percentage),
    },
    {
      label: "Donaciones confirmadas",
      value: formatMoney(report.donations.totalAmountInCents, report.donations.currency),
      detail: getMoneyComparisonDetail(
        report.donations.amountComparison.differenceInCents,
        report.donations.amountComparison.percentage,
        report.donations.currency,
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SummaryMetrics metrics={metrics} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Actividad de citas">
          <p className="mb-3 text-xs text-text-subtle">
            Por fecha programada; se muestran el total de citas y las realizadas.
          </p>
          <TrendChart
            labels={appointmentTimeline.map((item) => item.date)}
            series={[
              {
                label: "Citas",
                values: appointmentTimeline.map((item) => item.appointmentsCount),
                color: "primary",
              },
              {
                label: "Realizadas",
                values: appointmentTimeline.map(
                  (item) => item.completedAppointmentsCount,
                ),
                color: "accent",
              },
            ]}
          />
        </ChartCard>
        <ChartCard title="Monto de donaciones confirmadas">
          <TrendChart
            labels={report.timeline.map((item) => item.date)}
            valueLabel={(amount) => formatMoney(String(Math.round(amount)))}
            series={[
              {
                label: "Monto",
                values: report.timeline.map((item) =>
                  Number(BigInt(item.donationsAmountInCents)),
                ),
                color: "primary",
              },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}

/**
 * Renders appointment metrics, breakdowns, and records.
 * @param report Appointment evolution report response.
 * @param selectedState Optional state filter applied to the report.
 * @returns Appointment report content.
 */
function AppointmentsReportView({
  report,
  selectedState,
}: {
  report: AppointmentsEvolutionReport;
  selectedState?: string;
}) {
  const rows: ReportTableRow[] = report.records.map((record) => {
    const date =
      report.dateBasis === "created" ? record.createdAt : record.scheduledDate;
    return {
      id: record.appId,
      cells: [
        date ? formatDateLabel(date) : "Sin fecha programada",
        `#${record.appId}`,
        humanizeToken(record.kind),
        humanizeToken(record.state),
        humanizeToken(record.modality),
        record.psychologistName || "Sin asignar",
      ],
    };
  });
  const peakDay =
    report.peakDays.highest === null
      ? "—"
      : `${formatNumber(report.peakDays.highest.count)} citas`;
  const peakDayDetail =
    report.peakDays.highest === null
      ? "No hay citas en este periodo"
      : `El ${formatDateLabel(report.peakDays.highest.day)}`;
  const activeDays = report.timeline.filter((item) => item.total > 0).length;
  const timelineSeries =
    selectedState
      ? [
          {
            label: humanizeToken(selectedState),
            values: report.timeline.map((item) => item.total),
            color: "primary" as const,
          },
        ]
      : [
          {
            label: "Total",
            values: report.timeline.map((item) => item.total),
            color: "primary" as const,
          },
          {
            label: "Realizadas",
            values: report.timeline.map((item) => item.realizada),
            color: "accent" as const,
          },
        ];
  const metrics: ReportMetric[] = [
    {
      label: "Citas",
      value: formatNumber(report.totalAppointments),
      detail: getComparisonDetail(report.comparisonWithPrevious.percentage),
    },
    {
      label: "Promedio por día del periodo",
      value: formatNumberWithTwoDecimals(report.dailyAverage),
      detail: "Incluye también los días sin citas",
    },
    {
      label: "Días con citas",
      value: formatNumber(activeDays),
      detail: "Fechas con actividad según los filtros",
    },
    {
      label: "Día con más citas",
      value: peakDay,
      detail: peakDayDetail,
    },
  ];

  return (
    <div className="space-y-6">
      <SummaryMetrics metrics={metrics} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Citas a lo largo del tiempo">
          <p className="mb-3 text-xs text-text-subtle">
            Agrupadas por{" "}
            {report.dateBasis === "created" ? "fecha de solicitud" : "fecha programada"}.
            {selectedState
              ? ` Se muestran las citas en estado ${humanizeToken(selectedState)}.`
              : " Se comparan el total y las citas realizadas."}
          </p>
          <TrendChart
            labels={report.timeline.map((item) => item.date)}
            series={timelineSeries}
          />
        </ChartCard>
        <ChartCard title="Distribución por estado">
          <BreakdownBars
            items={report.byState.map((item) => ({
              label: humanizeToken(item.state),
              value: item.count,
              detail: `${formatNumber(item.count)} · ${formatPercent(item.percentage)}`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Por modalidad">
          <BreakdownBars
            items={report.byModality.map((item) => ({
              label: humanizeToken(item.modality),
              value: item.count,
              detail: `${formatNumber(item.count)} · ${formatPercent(item.percentage)}`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Por tipo de atención">
          <BreakdownBars
            items={report.byKind.map((item) => ({
              label: humanizeToken(item.kind),
              value: item.count,
              detail: `${formatNumber(item.count)} · ${formatPercent(item.percentage)}`,
            }))}
          />
        </ChartCard>
      </div>
      <ChartCard title="Registros de citas">
        <ReportTable
          headers={[
            report.dateBasis === "created" ? "Fecha de solicitud" : "Fecha programada",
            "Cita",
            "Tipo",
            "Estado",
            "Modalidad",
            "Psicólogo",
          ]}
          rows={rows}
          arrowPagination
        />
      </ChartCard>
    </div>
  );
}

/**
 * Renders attendance rates, trends, and psychologist breakdowns.
 * @param report Attendance report response.
 * @param onSelectPsychologist Applies a psychologist filter.
 * @returns Attendance report content.
 */
function AttendanceReportView({
  report,
  onSelectPsychologist,
}: {
  report: AttendanceReport;
  onSelectPsychologist: (psyId: number) => void;
}) {
  const { metrics } = report;
  const comparison = metrics.comparisonWithPreviousAttendanceRate;
  const compareDetail =
    comparison.difference === null
      ? "Sin comparación disponible"
      : `${comparison.difference > 0 ? "+" : ""}${formatNumber(comparison.difference)} puntos porcentuales vs. periodo anterior`;
  const psychologistRows: ReportTableRow[] = report.byPsychologist.map((item) => ({
    id: item.psyId ?? item.psychologistName,
    cells: [
      item.psychologistName,
      formatNumber(item.evaluated),
      formatNumber(item.completed),
      formatNumber(item.noShow),
      formatPercent(item.attendanceRate),
      formatPercent(item.noShowRate),
    ],
  }));
  const reportMetrics: ReportMetric[] = [
    {
      label: "Asistencia",
      value: formatPercent(metrics.attendanceRate),
      detail: `${formatNumber(metrics.evaluatedAppointments)} evaluadas · ${compareDetail}`,
    },
    {
      label: "Inasistencia",
      value: formatPercent(metrics.noShowRate),
      detail: `${formatNumber(metrics.noShowAppointments)} citas no asistidas`,
    },
    {
      label: "Citas evaluadas",
      value: formatNumber(metrics.evaluatedAppointments),
      detail: "Realizadas + no asistió; base de las tasas",
    },
    {
      label: "Citas realizadas",
      value: formatNumber(metrics.completedAppointments),
      detail: `${formatNumber(metrics.otherPastAppointments)} con otro estado`,
    },
  ];
  const singleMonth = report.monthlyEvolution.length === 1
    ? report.monthlyEvolution[0]
    : null;

  return (
    <div className="space-y-6">
      <SummaryMetrics metrics={reportMetrics} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title={
            singleMonth
              ? "Resumen mensual de asistencia"
              : "Evolución mensual de asistencia"
          }
        >
          {singleMonth ? (
            <div>
              <p className="mb-4 text-sm text-text-muted">
                Solo hay datos de un mes; se muestran los resultados, no una
                tendencia.
              </p>
              <BreakdownBars
                items={[
                  {
                    label: "Realizadas",
                    value: singleMonth.completed,
                    detail: `${formatNumber(singleMonth.completed)} citas · ${formatPercent(singleMonth.attendanceRate)}`,
                  },
                  {
                    label: "No asistió",
                    value: singleMonth.noShow,
                    detail: `${formatNumber(singleMonth.noShow)} citas · ${formatPercent(singleMonth.noShowRate)}`,
                  },
                ]}
              />
            </div>
          ) : (
            <TrendChart
              labels={report.monthlyEvolution.map((item) => item.month)}
              valueLabel={formatPercent}
              series={[
                {
                  label: "Asistencia",
                  values: report.monthlyEvolution.map(
                    (item) => item.attendanceRate,
                  ),
                  color: "primary",
                },
                {
                  label: "Inasistencia",
                  values: report.monthlyEvolution.map((item) => item.noShowRate),
                  color: "accent",
                },
              ]}
            />
          )}
        </ChartCard>
        <ChartCard title="Asistencia por modalidad">
          <BreakdownBars
            items={report.byModality.map((item) => ({
              label: humanizeToken(item.modality),
              value: item.attendanceRate ?? 0,
              detail: `${formatPercent(item.attendanceRate)} · ${formatNumber(item.evaluated)} evaluadas`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Asistencia por tipo de atención">
          <BreakdownBars
            items={report.byKind.map((item) => ({
              label: humanizeToken(item.kind),
              value: item.attendanceRate ?? 0,
              detail: `${formatPercent(item.attendanceRate)} · ${formatNumber(item.evaluated)} evaluadas`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Asistencia por psicólogo">
          <BreakdownBars
            items={report.byPsychologist.map((item) => ({
              label: item.psychologistName,
              value: item.attendanceRate ?? 0,
              detail: `${formatPercent(item.attendanceRate)} · ${formatNumber(item.evaluated)} evaluadas`,
            }))}
            onSelect={(index) => {
              const psychologist = report.byPsychologist[index];
              if (psychologist?.psyId !== null && psychologist?.psyId !== undefined) {
                onSelectPsychologist(psychologist.psyId);
              }
            }}
          />
          <p className="mt-3 text-xs text-text-subtle">
            Selecciona un nombre para filtrar este reporte por psicólogo.
          </p>
        </ChartCard>
      </div>
      <ChartCard title="Detalle por psicólogo">
        <ReportTable
          headers={[
            "Psicólogo",
            "Evaluadas",
            "Realizadas",
            "No asistió",
            "Asistencia",
            "Inasistencia",
          ]}
          rows={psychologistRows}
        />
      </ChartCard>
    </div>
  );
}

/**
 * Renders donation history charts, donor summary, and transactions.
 * @param report Donation history report response.
 * @param selectedDonorKey Current donor filter key.
 * @param onDonorKeyChange Updates or clears the donor filter.
 * @returns Donation history content.
 */
function DonationsHistoryView({
  report,
  selectedDonorKey,
  onDonorKeyChange,
}: {
  report: DonationsHistoryReport;
  selectedDonorKey: string;
  onDonorKeyChange: (donorKey: string) => void;
}) {
  const { summary } = report;
  const donorOptions = getDonorFilterOptions(report.transactions);
  const effectiveDonorKey = donorOptions.some(
    (option) => option.value === selectedDonorKey,
  )
    ? selectedDonorKey
    : "";
  const donorSummary = buildDonorDonationSummary(report.transactions, report.period, {
    donorKey: effectiveDonorKey || undefined,
  });
  const donorBars = donorSummary.donors.map((donor) => ({
    label: donor.label,
    value: Number(BigInt(donor.amountInCents)),
    detail: formatMoney(donor.amountInCents, summary.currency),
  }));
  const rows: ReportTableRow[] = report.transactions.map((transaction) => ({
    id: transaction.donId,
    cells: [
      getDateTimeLabel(transaction.createdAt),
      transaction.reference || transaction.wompiTransactionId || "—",
      transaction.donorFullName ?? "Donante sin identificar",
      transaction.donorEmailMasked ?? "—",
      humanizeToken(transaction.status),
      humanizeToken(transaction.paymentMethodType ?? "No informado"),
      formatMoney(transaction.amountInCents, transaction.currency),
    ],
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Transacciones por estado">
          <BreakdownBars
            items={report.byStatus.map((item) => ({
              label: humanizeToken(item.status),
              value: item.count,
              detail: `${formatNumber(item.count)} · ${formatPercent(item.percentage)} · ${formatMoney(item.amountInCents, summary.currency)}`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Medios de pago">
          <BreakdownBars
            items={report.byPaymentMethod.map((item) => ({
              label: humanizeToken(item.paymentMethod),
              value: item.count,
              detail: `${formatNumber(item.confirmedCount)} confirmadas · ${formatMoney(item.confirmedAmountInCents, summary.currency)}`,
            }))}
          />
        </ChartCard>
      </div>
      <ChartCard title="Monto confirmado por donante">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label htmlFor="donor-filter" className="min-w-60 flex-1">
            <span className="text-xs font-semibold text-text-muted">
              Donante (correo enmascarado cuando está disponible)
            </span>
            <select
              id="donor-filter"
              value={effectiveDonorKey}
              onChange={(event) => onDonorKeyChange(event.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">Vista general</option>
              {donorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {effectiveDonorKey && (
            <button
              type="button"
              onClick={() => onDonorKeyChange("")}
              className="mb-0.5 shrink-0 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-primary-dark transition hover:border-primary"
            >
              Limpiar
            </button>
          )}
        </div>
        {donorSummary.donors.length ? (
          <>
            <p className="mb-3 text-xs text-text-subtle">
              Suma de donaciones confirmadas durante el periodo seleccionado.{" "}
              {effectiveDonorKey
                ? "Se muestra el donante seleccionado."
                : "La vista general muestra los tres donantes principales; “Otros” agrupa al resto, incluidos los anónimos que no estén en el top 3."}
            </p>
            {summary.totalTransactions > report.transactions.length && (
              <p className="mb-3 rounded-xl bg-surface-muted px-3 py-2 text-xs text-text-muted">
                La gráfica usa las {formatNumber(report.transactions.length)}{" "}
                transacciones más recientes devueltas por el reporte; existen{" "}
                {formatNumber(summary.totalTransactions)} en total para estos
                filtros.
              </p>
            )}
            <VerticalBreakdownBars
              items={donorBars}
              emptyMessage="No hay montos confirmados para mostrar en este periodo."
            />
          </>
        ) : (
          <p className="rounded-xl bg-surface-muted px-4 py-8 text-center text-sm text-text-subtle">
            No hay donaciones confirmadas para representar en este periodo y
            con los filtros seleccionados.
          </p>
        )}
      </ChartCard>
      <ChartCard title="Transacciones">
        <ReportTable
          headers={[
            "Fecha",
            "Referencia",
            "Donante",
            "Correo",
            "Estado",
            "Medio",
            "Monto",
          ]}
          rows={rows}
        />
      </ChartCard>
    </div>
  );
}

/**
 * Renders confirmed donation metrics and monthly evolution.
 * @param report Donation evolution report response.
 * @returns Donation evolution content.
 */
function DonationsEvolutionView({
  report,
}: {
  report: DonationsEvolutionReport;
}) {
  const { summary, comparisonWithPrevious } = report;
  const monthlyTrend = buildMonthlyDonationTrend(report.timeline, report.period);
  const metrics: ReportMetric[] = [
    {
      label: "Aportes confirmados",
      value: formatMoney(summary.totalAmountInCents, summary.currency),
      detail: getMoneyComparisonDetail(
        comparisonWithPrevious.differenceInCents,
        comparisonWithPrevious.percentageVariation,
        summary.currency,
      ),
    },
    {
      label: "Número de aportes",
      value: formatNumber(summary.confirmedCount),
      detail: getComparisonDetail(
        comparisonWithPrevious.countComparison.percentage,
      ),
    },
    {
      label: "Aporte promedio",
      value: formatMoney(summary.averageAmountInCents, summary.currency),
      detail: "Entre las transacciones confirmadas",
    },
    {
      label: "Mayor aporte",
      value: summary.highestAmountInCents
        ? formatMoney(summary.highestAmountInCents, summary.currency)
        : "—",
      detail: summary.lowestAmountInCents
        ? `Menor: ${formatMoney(summary.lowestAmountInCents, summary.currency)}`
        : "Sin aportes en el periodo",
    },
  ];

  return (
    <div className="space-y-6">
      <SummaryMetrics metrics={metrics} />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Aportes por rango de valor">
          <BreakdownBars
            items={report.valueRanges.map((item) => ({
              label: item.rangeLabel,
              value: item.count,
              detail: `${formatNumber(item.count)} · ${formatPercent(item.percentageOfTotal)}`,
            }))}
          />
        </ChartCard>
      </div>
      <ChartCard title="Monto total donado por mes">
        {monthlyTrend.hasDonations ? (
          <div>
            <p className="mb-3 text-xs text-text-subtle">
              Suma de donaciones confirmadas por mes calendario; el primer y
              último mes pueden ser parciales según el periodo seleccionado.
              Desplaza horizontalmente para revisar todos los meses en periodos
              extensos.
            </p>
            {monthlyTrend.labels.length === 1 && (
              <p className="mb-3 text-xs text-text-subtle">
                El periodo solo abarca un mes; se muestra su total, pero aún
                no hay meses para comparar la fluctuación.
              </p>
            )}
            <TrendChart
              labels={monthlyTrend.labels}
              valueLabel={(amount) =>
                formatMoney(String(Math.round(amount)), summary.currency)
              }
              series={[
                {
                  label: "Total mensual",
                  values: monthlyTrend.values,
                  color: "primary",
                },
              ]}
              showDataPoints
              expanded
            />
          </div>
        ) : (
          <p className="rounded-xl bg-surface-muted px-4 py-8 text-center text-sm text-text-subtle">
            No hay donaciones confirmadas para representar en este periodo.
          </p>
        )}
      </ChartCard>
    </div>
  );
}

/**
 * Renders filters for the active report and connects their handlers.
 * @param activeKind Active report type.
 * @param query Current date and report-specific filters.
 * @param psychologists Available psychologist options.
 * @param paymentMethods Available payment method options.
 * @param onChange Updates report filters.
 * @param onSelectPsychologist Applies the selected psychologist.
 * @param onClearPsychologist Clears the psychologist filter.
 * @returns Report-specific filter controls.
 */
function ReportFilters({
  activeKind,
  query,
  psychologists,
  paymentMethods,
  onChange,
  onSelectPsychologist,
  onClearPsychologist,
}: {
  activeKind: ReportKind;
  query: ReportQuery;
  psychologists: PsychologistFilterOption[];
  paymentMethods: PaymentMethodOption[];
  onChange: (next: ReportQuery) => void;
  onSelectPsychologist: (psyId: number) => void;
  onClearPsychologist: () => void;
}) {
  const select = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    key: keyof ReportQuery,
  ) => (
    <label className="min-w-36 flex-1">
      <span className="text-xs font-semibold text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange({ ...query, [key]: event.target.value || undefined })}
        className={FIELD_CLASS}
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );

  if (activeKind === "appointments") {
    return (
      <div className="flex flex-wrap gap-3">
        {select(
          "Agrupar por fecha",
          query.dateBasis ?? "scheduled",
          [
            { value: "scheduled", label: "Fecha programada" },
            { value: "created", label: "Fecha de solicitud" },
          ],
          "dateBasis",
        )}
        {select(
          "Estado",
          query.state ?? "",
          [
            { value: "pendiente", label: "Pendiente" },
            { value: "asignada", label: "Asignada" },
            { value: "confirmada", label: "Confirmada" },
            { value: "realizada", label: "Realizada" },
            { value: "cancelada", label: "Cancelada" },
            { value: "no_asistio", label: "No asistió" },
            { value: "descartada", label: "Descartada" },
          ],
          "state",
        )}
        {select(
          "Modalidad",
          query.modality ?? "",
          [
            { value: "virtual", label: "Virtual" },
            { value: "presencial", label: "Presencial" },
          ],
          "modality",
        )}
        {select(
          "Tipo",
          query.kind ?? "",
          [
            { value: "valoracion", label: "Valoración" },
            { value: "paquete", label: "Paquete" },
          ],
          "kind",
        )}
      </div>
    );
  }

  if (activeKind === "attendance") {
    return (
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          {select(
            "Modalidad",
            query.modality ?? "",
            [
              { value: "virtual", label: "Virtual" },
              { value: "presencial", label: "Presencial" },
            ],
            "modality",
          )}
          {select(
            "Tipo",
            query.kind ?? "",
            [
              { value: "valoracion", label: "Valoración" },
              { value: "paquete", label: "Paquete" },
            ],
            "kind",
          )}
        </div>
        <div className="flex min-w-48 flex-1 items-end gap-2">
          <label className="min-w-36 flex-1">
            <span className="text-xs font-semibold text-text-muted">
              Psicólogo
            </span>
            <select
              value={query.psyId?.toString() ?? ""}
              onChange={(event) => {
                if (event.target.value) {
                  onSelectPsychologist(Number(event.target.value));
                } else {
                  onChange({ ...query, psyId: undefined });
                }
              }}
              className={FIELD_CLASS}
            >
              <option value="">Todos</option>
              {psychologists.map((psychologist) => (
                <option key={psychologist.id} value={psychologist.id}>
                  {psychologist.name}
                </option>
              ))}
            </select>
          </label>
          {query.psyId !== undefined && (
            <button
              type="button"
              onClick={onClearPsychologist}
              className="mt-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-primary-dark transition hover:border-primary"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (activeKind === "donations-history") {
    return (
      <div className="flex flex-wrap gap-3">
        {select(
          "Estado",
          query.status ?? "",
          [
            { value: "APPROVED", label: "Aprobada" },
            { value: "PENDING", label: "Pendiente" },
            { value: "DECLINED", label: "Rechazada" },
          ],
          "status",
        )}
        <PaymentMethodFilter
          key={`${activeKind}-${query.paymentMethod ?? ""}`}
          value={query.paymentMethod ?? ""}
          options={paymentMethods}
          onApply={(paymentMethod) =>
            onChange({ ...query, paymentMethod: paymentMethod || undefined })
          }
        />
      </div>
    );
  }

  if (activeKind === "donations-evolution") {
    return (
      <PaymentMethodFilter
        key={`${activeKind}-${query.paymentMethod ?? ""}`}
        value={query.paymentMethod ?? ""}
        options={paymentMethods}
        onApply={(paymentMethod) =>
          onChange({ ...query, paymentMethod: paymentMethod || undefined })
        }
      />
    );
  }

  return null;
}

/**
 * Provides searchable payment method options.
 * @param value Selected payment method.
 * @param options Available payment methods.
 * @param onApply Applies the selected method.
 * @returns Payment method autocomplete control.
 */
function PaymentMethodFilter({
  value,
  options,
  onApply,
}: {
  value: string;
  options: PaymentMethodOption[];
  onApply: (value: string) => void;
}) {
  const selectedLabel =
    options.find(
      (option) => option.value.toLocaleLowerCase("es-CO") === value.toLocaleLowerCase("es-CO"),
    )?.label ?? value;
  const [draft, setDraft] = useState(selectedLabel);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const search = draft.trim().toLocaleLowerCase("es-CO");
  const matchingOptions = options
    .filter(
      (option) =>
        option.label.toLocaleLowerCase("es-CO").includes(search) ||
        option.value.toLocaleLowerCase("es-CO").includes(search),
    )
    .slice(0, 8);

  return (
    <form
      className="flex min-w-36 flex-1 items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft.trim());
        setSuggestionsOpen(false);
      }}
    >
      <div className="relative min-w-0 flex-1">
        <label className="block min-w-0">
          <span className="text-xs font-semibold text-text-muted">
            Medio de pago
          </span>
          <input
            role="combobox"
            aria-autocomplete="list"
            aria-controls="payment-method-options"
            aria-expanded={suggestionsOpen && matchingOptions.length > 0}
            value={draft}
            onFocus={() => setSuggestionsOpen(true)}
            onChange={(event) => {
              setDraft(event.target.value);
              setSuggestionsOpen(true);
            }}
            placeholder="Escribe para buscar"
            className={FIELD_CLASS}
          />
        </label>
        {suggestionsOpen && matchingOptions.length > 0 && (
          <ul
            id="payment-method-options"
            role="listbox"
            className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
          >
            {matchingOptions.map((option) => (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setDraft(option.label);
                    setSuggestionsOpen(false);
                    onApply(option.value);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="submit"
        className="mb-0.5 shrink-0 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-primary-dark transition hover:border-primary"
      >
        Aplicar
      </button>
    </form>
  );
}

/**
 * Gets period metadata from a loaded report response.
 * @param response Loaded report or null.
 * @returns Period metadata, or null before a report is available.
 */
function getReportPeriod(response: ReportResponse | null): ReportPeriod | null {
  return response?.data.period ?? null;
}

/**
 * Selects the report view matching the active response type.
 * @param response Loaded report response.
 * @param onSelectPsychologist Psychologist filter callback.
 * @param donorFilter Donor filter state and callback.
 * @param selectedAppointmentState Optional appointment state filter.
 * @returns The matching report view, or null when no response is loaded.
 */
function renderReport(
  response: ReportResponse | null,
  onSelectPsychologist: (psyId: number) => void,
  donorFilter: DonorFilterState,
  selectedAppointmentState?: string,
) {
  if (!response) return null;
  switch (response.kind) {
    case "general":
      return <GeneralReportView report={response.data} />;
    case "appointments":
      return (
        <AppointmentsReportView
          report={response.data}
          selectedState={selectedAppointmentState}
        />
      );
    case "attendance":
      return (
        <AttendanceReportView
          report={response.data}
          onSelectPsychologist={onSelectPsychologist}
        />
      );
    case "donations-history":
      return (
        <DonationsHistoryView
          report={response.data}
          selectedDonorKey={donorFilter.donorKey}
          onDonorKeyChange={donorFilter.onDonorKeyChange}
        />
      );
    case "donations-evolution":
      return <DonationsEvolutionView report={response.data} />;
  }
}

/**
 * Administrator dashboard for general, appointment, attendance, and donation
 * reports, using the common date filter and each report's dedicated endpoint.
 * @returns Administrator report dashboard.
 */
export default function ReportsDashboardPage() {
  const [defaultDates] = useState(getDefaultDates);
  const [activeSection, setActiveSection] = useState<ReportSection>("general");
  const [donationView, setDonationView] =
    useState<DonationReportKind>("donations-history");
  const [query, setQuery] = useState<ReportQuery>({ preset: "last_month" });
  const [draftStartDate, setDraftStartDate] = useState(defaultDates.startDate);
  const [draftEndDate, setDraftEndDate] = useState(defaultDates.endDate);
  const [dateError, setDateError] = useState<string | null>(null);
  const [psychologistOptions, setPsychologistOptions] = useState<
    PsychologistFilterOption[]
  >([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<
    PaymentMethodOption[]
  >([]);
  const [selectedDonorKey, setSelectedDonorKey] = useState("");
  const activeKind: ReportKind =
    activeSection === "donations" ? donationView : activeSection;
  const { response, isLoading, error, refresh } = useReportsDashboard(
    activeKind,
    query,
    query.preset !== "custom" || Boolean(query.startDate && query.endDate),
  );

  const reportPsychologistOptions =
    query.psyId === undefined && response?.kind === "attendance"
      ? getPsychologistFilterOptions(response.data)
      : null;
  const availablePsychologists =
    reportPsychologistOptions ?? psychologistOptions;
  const reportPaymentMethodOptions =
    response?.kind === "donations-history"
      ? getPaymentMethodOptions(response.data)
      : null;
  const availablePaymentMethods =
    reportPaymentMethodOptions &&
    query.paymentMethod === undefined &&
    query.status === undefined
      ? reportPaymentMethodOptions
      : paymentMethodOptions.length
        ? paymentMethodOptions
        : reportPaymentMethodOptions ?? [];

  const period = getReportPeriod(response);
  const activeTab = TABS.find((tab) => tab.kind === activeSection) ?? TABS[0];
  const Icon = activeTab.icon;

  function changePreset(preset: ReportPreset) {
    setDateError(null);
    if (preset === "custom") {
      setQuery((current) => ({ ...current, preset }));
      return;
    }
    setQuery((current) => ({
      ...current,
      preset,
      startDate: undefined,
      endDate: undefined,
    }));
  }

  function applyCustomRange() {
    if (!draftStartDate || !draftEndDate) {
      setDateError("Selecciona la fecha inicial y final.");
      return;
    }
    if (draftStartDate > draftEndDate) {
      setDateError("La fecha inicial debe ser anterior o igual a la fecha final.");
      return;
    }
    setDateError(null);
    setQuery((current) => ({
      ...current,
      preset: "custom",
      startDate: draftStartDate,
      endDate: draftEndDate,
    }));
  }

  function changeReportFilter(next: ReportQuery) {
    if (
      response?.kind === "donations-history" &&
      query.paymentMethod === undefined
    ) {
      const currentOptions = getPaymentMethodOptions(response.data);
      if (currentOptions.length) {
        setPaymentMethodOptions((previous) =>
          previous.length && query.status !== undefined
            ? previous
            : currentOptions,
        );
      }
    }
    setQuery(next);
  }

  function changeDonationView(view: DonationReportKind) {
    if (
      response?.kind === "donations-history" &&
      query.paymentMethod === undefined
    ) {
      const currentOptions = getPaymentMethodOptions(response.data);
      if (currentOptions.length) {
        setPaymentMethodOptions((previous) =>
          previous.length && query.status !== undefined
            ? previous
            : currentOptions,
        );
      }
    }
    if (view === "donations-evolution" && query.status !== undefined) {
      setQuery((current) => ({ ...current, status: undefined }));
    }
    setDonationView(view);
  }

  function selectPsychologist(psyId: number) {
    if (query.psyId === undefined && response?.kind === "attendance") {
      setPsychologistOptions(getPsychologistFilterOptions(response.data));
    }
    setQuery((current) => ({ ...current, psyId }));
  }

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
              Indicadores de gestión, citas, asistencia y donaciones.
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

        <section
          aria-label="Filtros de periodo"
          className="mt-6 rounded-2xl border border-border bg-surface p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="block w-full sm:max-w-xs">
              <span className="text-sm font-semibold text-text">Periodo</span>
              <select
                value={query.preset}
                onChange={(event) =>
                  changePreset(event.target.value as ReportPreset)
                }
                className={FIELD_CLASS}
              >
                {PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            {query.preset === "custom" && (
              <>
                <label className="block w-full sm:max-w-xs">
                  <span className="text-sm font-semibold text-text">
                    Desde
                  </span>
                  <input
                    type="date"
                    value={draftStartDate}
                    max={draftEndDate || undefined}
                    onChange={(event) => setDraftStartDate(event.target.value)}
                    className={FIELD_CLASS}
                  />
                </label>
                <label className="block w-full sm:max-w-xs">
                  <span className="text-sm font-semibold text-text">Hasta</span>
                  <input
                    type="date"
                    value={draftEndDate}
                    min={draftStartDate || undefined}
                    onChange={(event) => setDraftEndDate(event.target.value)}
                    className={FIELD_CLASS}
                  />
                </label>
                <button
                  type="button"
                  onClick={applyCustomRange}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  Aplicar rango
                </button>
              </>
            )}
          </div>
          {dateError && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {dateError}
            </p>
          )}
          {period && (
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-subtle">
              <span className="inline-flex items-center gap-1 font-semibold text-text-muted">
                <CalendarDays size={13} aria-hidden />
                {period.periodLabel}
              </span>
              <span>Generado {getDateTimeLabel(period.generatedAt)}</span>
            </p>
          )}
        </section>

        <div
          role="tablist"
          aria-label="Tipo de reporte"
          className="mt-6 flex gap-2 overflow-x-auto pb-2"
        >
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const selected = activeSection === tab.kind;
            return (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveSection(tab.kind)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                  selected
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
                }`}
              >
                <TabIcon size={16} aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>

        <section
          role="tabpanel"
          aria-label={activeTab.label}
          aria-busy={isLoading}
          className="mt-4 space-y-5"
        >
          {activeSection === "donations" && (
            <div
              role="tablist"
              aria-label="Sección de donaciones"
              className="flex gap-2"
            >
              {DONATION_TABS.map((tab) => (
                <button
                  key={tab.kind}
                  type="button"
                  role="tab"
                  aria-selected={donationView === tab.kind}
                  onClick={() => changeDonationView(tab.kind)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    donationView === tab.kind
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {activeKind !== "general" && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-primary-dark">
                <Icon size={18} aria-hidden />
                Filtros de {activeTab.label.toLowerCase()}
              </h2>
              <ReportFilters
                activeKind={activeKind}
                query={query}
                psychologists={availablePsychologists}
                paymentMethods={availablePaymentMethods}
                onChange={changeReportFilter}
                onSelectPsychologist={selectPsychologist}
                onClearPsychologist={() =>
                  setQuery((current) => ({ ...current, psyId: undefined }))
                }
              />
            </div>
          )}

          {error && (
            <InlineMessage tone="error">
              {error}
              <button
                type="button"
                onClick={refresh}
                className="ml-2 font-semibold underline"
              >
                Reintentar
              </button>
            </InlineMessage>
          )}

          {isLoading && (
            <p
              role="status"
              className="rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle"
            >
              Cargando {activeTab.label.toLowerCase()}…
            </p>
          )}

          {!isLoading && !error && !response && query.preset === "custom" && (
            <p className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
              Selecciona ambas fechas y aplica el rango personalizado para consultar el reporte.
            </p>
          )}

          {!isLoading && !error && response && renderReport(
            response,
            selectPsychologist,
            {
              donorKey: selectedDonorKey,
              onDonorKeyChange: setSelectedDonorKey,
            },
            query.state,
          )}
        </section>
      </div>
    </>
  );
}
