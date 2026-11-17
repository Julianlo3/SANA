"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatDateLabel,
  formatNumber,
} from "../lib/report-format";

/** Summary metric content displayed in a report card. */
export type ReportMetric = {
  label: string;
  value: string;
  detail: string;
};

/**
 * Renders report metrics in a responsive card grid.
 * @param metrics Metric values and supporting details.
 * @returns Summary metric cards.
 */
export function MetricGrid({ metrics }: { metrics: ReportMetric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-2xl border border-border bg-surface p-5"
        >
          <p className="text-sm font-medium text-text-muted">{metric.label}</p>
          <p className="mt-3 break-words font-display text-3xl font-bold text-primary">
            {metric.value}
          </p>
          <p className="mt-2 text-xs text-text-subtle">{metric.detail}</p>
        </article>
      ))}
    </div>
  );
}

/**
 * Wraps report content in a titled chart section.
 * @param title Section heading.
 * @param children Chart or report content.
 * @returns A styled report section.
 */
export function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-lg font-bold text-primary-dark">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Time-series values, where null creates a gap in the line. */
type TrendSeries = {
  label: string;
  values: (number | null)[];
  color: "primary" | "accent" | "navy" | "muted";
};

const TREND_COLORS: Record<TrendSeries["color"], string> = {
  primary: "var(--color-primary)",
  accent: "var(--color-accent)",
  navy: "var(--color-navy)",
  muted: "var(--color-text-subtle)",
};

/**
 * Renders one or more indexed time series with optional date labels and points.
 * @param labels Ordered x-axis labels.
 * @param series Series values and colors.
 * @param valueLabel Formatter for y-axis values and point tooltips.
 * @param dateLabels Whether to render x-axis labels.
 * @param showDataPoints Whether to render individual values as points.
 * @param expanded Whether to use the larger, horizontally scrollable layout.
 * @returns An SVG trend chart or an empty-state message.
 */
export function TrendChart({
  labels,
  series,
  valueLabel = formatNumber,
  dateLabels = true,
  showDataPoints = true,
  expanded = false,
}: {
  labels: string[];
  series: TrendSeries[];
  valueLabel?: (value: number) => string;
  dateLabels?: boolean;
  showDataPoints?: boolean;
  expanded?: boolean;
}) {
  const allValues = series.flatMap((item) =>
    item.values.filter((value): value is number => value !== null),
  );
  if (!labels.length || !allValues.length) {
    return (
      <p className="rounded-xl bg-surface-muted px-4 py-8 text-center text-sm text-text-subtle">
        No hay datos para representar en este periodo.
      </p>
    );
  }

  const maxValue = Math.max(...allValues, 1);
  const chartWidth = expanded
    ? Math.max(1080, labels.length * 88 + 152)
    : 720;
  const chartHeight = expanded ? 360 : 168;
  const left = expanded ? 88 : 36;
  const right = chartWidth - (expanded ? 88 : 16);
  const top = expanded ? 32 : 12;
  const bottom = expanded ? 280 : 136;
  const xFor = (index: number) =>
    labels.length === 1
      ? (left + right) / 2
      : left + (index / (labels.length - 1)) * (right - left);
  const yFor = (value: number) =>
    bottom - (value / maxValue) * (bottom - top);
  const labelIndexes = expanded
    ? labels.map((_, index) => index)
    : [...new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])];
  const gridFractions = expanded ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
        {series.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-2 text-xs text-text-muted"
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: TREND_COLORS[item.color] }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div className={expanded ? "overflow-x-auto pb-2" : undefined}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label={`Gráfico de tendencia: ${series.map((item) => item.label).join(", ")}`}
          className="h-auto w-full overflow-visible"
          style={expanded ? { minWidth: `${chartWidth}px` } : undefined}
        >
          <title>{series.map((item) => item.label).join(" y ")}</title>
          {gridFractions.map((fraction) => {
            const y = bottom - fraction * (bottom - top);
            return (
              <g key={fraction}>
                <line
                  x1={left}
                  x2={right}
                  y1={y}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray="3 4"
                />
                <text
                  x={left - 7}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--color-text-subtle)"
                  fontSize={expanded ? "12" : "9"}
                >
                  {valueLabel(maxValue * fraction)}
                </text>
              </g>
            );
          })}
          {series.map((item) => {
            const segments: string[] = [];
            let segment = "";
            item.values.forEach((value, index) => {
              if (value === null) {
                if (segment) segments.push(segment);
                segment = "";
                return;
              }
              segment += `${segment ? " L" : "M"}${xFor(index)},${yFor(value)}`;
            });
            if (segment) segments.push(segment);

            return (
              <g key={item.label}>
                {segments.map((path, index) => (
                  <path
                    key={`${item.label}-${index}`}
                    d={path}
                    fill="none"
                    stroke={TREND_COLORS[item.color]}
                    strokeWidth={expanded ? "3.5" : "2.5"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {showDataPoints &&
                  item.values.map((value, index) => {
                    if (value === null) return null;
                    return (
                      <circle
                        key={`${item.label}-${labels[index]}`}
                        cx={xFor(index)}
                        cy={yFor(value)}
                        r={expanded ? "5" : "3"}
                        fill={TREND_COLORS[item.color]}
                      >
                        <title>
                          {formatDateLabel(labels[index])}: {item.label}{" "}
                          {valueLabel(value)}
                        </title>
                      </circle>
                    );
                  })}
              </g>
            );
          })}
          {dateLabels &&
            labelIndexes.map((index) => (
              <text
                key={labels[index]}
                x={xFor(index)}
                y={expanded ? "330" : "158"}
                textAnchor={
                  expanded
                    ? "middle"
                    : index === 0
                      ? "start"
                      : index === labels.length - 1
                        ? "end"
                        : "middle"
                }
                fill="var(--color-text-subtle)"
                fontSize={expanded ? "12" : "9"}
                fontWeight={expanded ? "600" : "400"}
              >
                {formatDateLabel(labels[index], /^\d{4}-\d{2}$/.test(labels[index]))}
              </text>
            ))}
        </svg>
      </div>
    </div>
  );
}

/**
 * Renders proportional horizontal bars for report categories.
 * @param items Category labels, values, and details.
 * @param emptyMessage Message shown when there are no categories.
 * @param onSelect Optional category selection callback.
 * @returns A bar list or an empty-state message.
 */
export function BreakdownBars({
  items,
  emptyMessage = "No hay datos para este periodo.",
  onSelect,
}: {
  items: { label: string; value: number; detail: string }[];
  emptyMessage?: string;
  onSelect?: (index: number) => void;
}) {
  if (!items.length) {
    return (
      <p className="rounded-xl bg-surface-muted px-4 py-8 text-center text-sm text-text-subtle">
        {emptyMessage}
      </p>
    );
  }
  const maximum = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-4">
      {items.map((item, index) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(index)}
                className="min-w-0 truncate text-left font-medium text-primary-dark underline-offset-2 hover:underline"
              >
                {item.label}
              </button>
            ) : (
              <span className="min-w-0 truncate font-medium text-text">
                {item.label}
              </span>
            )}
            <span className="shrink-0 text-text-muted">{item.detail}</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-primary-soft"
            role="img"
            aria-label={`${item.label}: ${item.detail}`}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min(100, Math.max(0, (item.value / maximum) * 100))}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Renders proportional vertical bars for ranked report values.
 * @param items Category labels, values, and details.
 * @param emptyMessage Message shown when there are no categories.
 * @returns A vertical bar chart or an empty-state message.
 */
export function VerticalBreakdownBars({
  items,
  emptyMessage = "No hay datos para este periodo.",
}: {
  items: { label: string; value: number; detail: string }[];
  emptyMessage?: string;
}) {
  if (!items.length) {
    return (
      <p className="rounded-xl bg-surface-muted px-4 py-8 text-center text-sm text-text-subtle">
        {emptyMessage}
      </p>
    );
  }

  const maximum = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="overflow-x-auto rounded-2xl bg-gradient-to-b from-surface-muted/70 to-surface px-4 py-5 sm:px-6">
      <ul
        aria-label="Montos representados en barras verticales"
        className="relative grid gap-3 sm:gap-5"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          minWidth: items.length > 2 ? "22rem" : undefined,
        }}
      >
        <li
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-8 bottom-[2.75rem] flex flex-col justify-between"
        >
          {[0, 1, 2, 3].map((line) => (
            <span
              key={line}
              className="border-t border-dashed border-border/80"
            />
          ))}
        </li>
        {items.map((item) => {
          const height = Math.min(
            100,
            Math.max(item.value > 0 ? 6 : 0, (item.value / maximum) * 100),
          );
          return (
            <li key={item.label} className="min-w-0">
              <div
                role="img"
                aria-label={`${item.label}: ${item.detail}`}
                className="grid grid-rows-[2rem_10rem_2.75rem] items-end text-center"
              >
                <span
                  aria-hidden
                  title={item.detail}
                  className="mx-auto max-w-full truncate rounded-full border border-border/70 bg-surface px-2.5 py-1 text-[11px] font-bold text-primary-dark shadow-sm"
                >
                  {item.detail}
                </span>
                <div
                  aria-hidden
                  className="flex h-full items-end justify-center px-2"
                >
                  <div
                    className="w-full max-w-[5.5rem] rounded-t-2xl bg-gradient-to-t from-primary to-accent shadow-md shadow-primary/15 transition-[height] duration-500 motion-reduce:transition-none"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span
                  aria-hidden
                  title={item.label}
                  className="mx-auto w-full max-w-40 truncate pt-2 text-xs font-semibold text-text"
                >
                  {item.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Stable row identity and rendered cell content for a report table. */
export type ReportTableRow = {
  id: string | number;
  cells: ReactNode[];
};

/**
 * Renders a report table with ten-row pagination.
 * @param headers Column headings.
 * @param rows Table rows.
 * @param arrowPagination Whether pagination controls use arrow icons.
 * @returns A paginated table or an empty-state message.
 */
export function ReportTable({
  headers,
  rows,
  arrowPagination = false,
}: {
  headers: string[];
  rows: ReportTableRow[];
  arrowPagination?: boolean;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = rows.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  if (!rows.length) {
    return (
      <p className="rounded-xl bg-surface-muted px-4 py-8 text-center text-sm text-text-subtle">
        No hay registros para mostrar.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-text-subtle">
              {headers.map((header) => (
                <th key={header} scope="col" className="px-3 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${index}`} className="px-3 py-3 text-text">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > pageSize && (
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-text-muted">
          <span>
            {currentPage * pageSize + 1}–
            {Math.min((currentPage + 1) * pageSize, rows.length)} de {rows.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label={arrowPagination ? "Página anterior" : undefined}
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="rounded-full border border-border px-3 py-1.5 font-semibold hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {arrowPagination ? (
                <ChevronLeft size={16} aria-hidden />
              ) : (
                "Anterior"
              )}
            </button>
            <button
              type="button"
              aria-label={arrowPagination ? "Página siguiente" : undefined}
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= pageCount - 1}
              className="rounded-full border border-border px-3 py-1.5 font-semibold hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {arrowPagination ? (
                <ChevronRight size={16} aria-hidden />
              ) : (
                "Siguiente"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
