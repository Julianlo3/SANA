import type { DonationsEvolutionReport, ReportPeriod } from "../types/report-types";

/** Monthly labels and totals derived from a daily donation timeline. */
type MonthlyTrend = {
  labels: string[];
  values: number[];
  hasDonations: boolean;
};

/**
 * Resolves a date or timestamp to its Bogotá calendar month.
 * @param value Date, month, or timestamp value.
 * @returns YYYY-MM month or null for invalid input.
 */
function getBogotaMonth(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get("year");
  const month = values.get("month");
  return year && month ? `${year}-${month}` : null;
}

/**
 * Lists every calendar month intersecting a date range.
 * @param startDate Inclusive period start.
 * @param endDate Inclusive period end.
 * @returns Ordered YYYY-MM month labels.
 */
function getMonthRange(startDate: string, endDate: string): string[] {
  const firstMonth = getBogotaMonth(startDate);
  const lastMonth = getBogotaMonth(endDate);
  if (!firstMonth || !lastMonth || firstMonth > lastMonth) return [];

  const [startYear, startMonth] = firstMonth.split("-").map(Number);
  const [endYear, endMonth] = lastMonth.split("-").map(Number);
  const months: string[] = [];
  let monthIndex = startYear * 12 + startMonth - 1;
  const lastMonthIndex = endYear * 12 + endMonth - 1;

  while (monthIndex <= lastMonthIndex) {
    const year = Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    monthIndex += 1;
  }

  return months;
}

/**
 * Sums daily approved donation amounts into calendar months.
 * @param timeline Daily donation aggregates.
 * @param period Inclusive report date boundaries.
 * @returns Monthly labels, cent totals, and whether any donations exist.
 */
export function buildMonthlyDonationTrend(
  timeline: DonationsEvolutionReport["timeline"],
  period: Pick<ReportPeriod, "startDate" | "endDate">,
): MonthlyTrend {
  const amountsByMonth = new Map<string, bigint>();
  for (const item of timeline) {
    const month = getBogotaMonth(item.date);
    if (!month) continue;

    amountsByMonth.set(
      month,
      (amountsByMonth.get(month) ?? BigInt(0)) + BigInt(item.amountInCents),
    );
  }

  const labels = getMonthRange(period.startDate, period.endDate);
  const amounts = labels.map((month) => amountsByMonth.get(month) ?? BigInt(0));
  return {
    labels,
    values: amounts.map(Number),
    hasDonations: amounts.some((amount) => amount > BigInt(0)),
  };
}
