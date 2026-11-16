import { ReportPreset } from './dto/report-presets.enum.js';

export interface ResolvedDateRange {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
  preset?: ReportPreset;
  periodLabel: string;
}

export interface MetricComparison {
  current: number;
  previous: number;
  difference: number;
  percentage: number | null;
}

/**
 * Parses a date string safely without timezone-induced day shifts.
 */
function parseDateBoundary(dateStr: string, isEnd = false): Date {
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    const [year, month, day] = parts;
    if (isEnd) {
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  return new Date(dateStr);
}

/**
 * Formats a Date object as YYYY-MM-DD using local calendar date.
 */
function formatDateLabel(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Resolves query parameters into concrete start and end dates along with the equivalent previous period.
 */
export function resolveReportDateRange(query: {
  preset?: ReportPreset;
  startDate?: string;
  endDate?: string;
}): ResolvedDateRange {
  const now = new Date();

  const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const endOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
  };

  let startDate: Date;
  let endDate: Date;
  let preset = query.preset;

  if (query.startDate && query.endDate) {
    startDate = parseDateBoundary(query.startDate, false);
    endDate = parseDateBoundary(query.endDate, true);
    preset = ReportPreset.Custom;
  } else if (query.startDate && !query.endDate) {
    startDate = parseDateBoundary(query.startDate, false);
    endDate = endOfDay(now);
    preset = ReportPreset.Custom;
  } else {
    // Presets
    const effectivePreset = query.preset ?? ReportPreset.LastMonth;
    preset = effectivePreset;

    switch (effectivePreset) {
      case ReportPreset.Today: {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      }
      case ReportPreset.Last7Days: {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        startDate = startOfDay(start);
        endDate = endOfDay(now);
        break;
      }
      case ReportPreset.LastMonth: {
        const start = new Date(now);
        start.setDate(now.getDate() - 29);
        startDate = startOfDay(start);
        endDate = endOfDay(now);
        break;
      }
      case ReportPreset.Last3Months: {
        const start = new Date(now);
        start.setDate(now.getDate() - 89);
        startDate = startOfDay(start);
        endDate = endOfDay(now);
        break;
      }
      case ReportPreset.CurrentYear: {
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = endOfDay(now);
        break;
      }
      case ReportPreset.Custom:
      default: {
        const start = new Date(now);
        start.setDate(now.getDate() - 29);
        startDate = startOfDay(start);
        endDate = endOfDay(now);
        break;
      }
    }
  }

  // Ensure startDate <= endDate
  if (startDate.getTime() > endDate.getTime()) {
    const temp = startDate;
    startDate = endDate;
    endDate = temp;
  }

  // Calculate equivalent previous period of equal duration
  const durationMs = endDate.getTime() - startDate.getTime() + 1;
  const previousEndDate = new Date(startDate.getTime() - 1);
  const previousStartDate = new Date(previousEndDate.getTime() - durationMs + 1);

  const periodLabel = `${formatDateLabel(startDate)} al ${formatDateLabel(endDate)}`;

  return {
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
    preset,
    periodLabel,
  };
}

/**
 * Calculates variation between current and previous numerical metrics.
 * Follows spec requirement: returns null for percentage if previous is 0.
 */
export function compareMetrics(current: number, previous: number): MetricComparison {
  const difference = current - previous;
  if (previous === 0) {
    return {
      current,
      previous,
      difference,
      percentage: current === 0 ? 0 : null,
    };
  }

  const percentage = Number((((current - previous) / previous) * 100).toFixed(2));
  return {
    current,
    previous,
    difference,
    percentage,
  };
}

/**
 * Masks an email for privacy compliance in reports.
 * Example: `juan.perez@gmail.com` -> `j********z@gmail.com`
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return '***';

  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${'*'.repeat(Math.max(1, name.length - 2))}${name[name.length - 1]}@${domain}`;
}
