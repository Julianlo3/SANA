const numberFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 1,
});
const twoDecimalNumberFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a number with one optional decimal place.
 * @param value Numeric value to format.
 * @returns Localized number string.
 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/**
 * Formats a number with exactly two decimal places.
 * @param value Numeric value to format.
 * @returns Localized number string with two decimals.
 */
export function formatNumberWithTwoDecimals(value: number): string {
  return twoDecimalNumberFormatter.format(value);
}

/**
 * Converts integer cents to a rounded currency string.
 * @param amountInCents Amount expressed in cents.
 * @param currency ISO currency code.
 * @returns Localized currency string.
 */
export function formatMoney(
  amountInCents: string,
  currency = "COP",
): string {
  const cents = BigInt(amountInCents);
  const isNegative = cents < 0;
  const absoluteCents = isNegative ? -cents : cents;
  const roundedPesos =
    absoluteCents / BigInt(100) +
    (absoluteCents % BigInt(100) >= BigInt(50) ? BigInt(1) : BigInt(0));
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(isNegative ? -roundedPesos : roundedPesos);
}

/**
 * Formats a nullable percentage, preserving unavailable values.
 * @param value Percentage value or null.
 * @returns Localized percentage string or an em dash.
 */
export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${numberFormatter.format(value)}%`;
}

/**
 * Formats a percentage change against the previous period.
 * @param value Percentage change or null.
 * @returns Signed comparison label.
 */
export function formatSignedPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "Sin comparación disponible";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${numberFormatter.format(value)}% vs. periodo anterior`;
}

/**
 * Formats a date or month label in the Bogotá time zone.
 * @param value ISO date, month, or timestamp.
 * @param monthOnly Whether to omit the day from date labels.
 * @returns Localized date label, or the original value if invalid.
 */
export function formatDateLabel(value: string, monthOnly = false): string {
  const dateValue = /^\d{4}-\d{2}$/.test(value)
    ? `${value}-15T12:00:00`
    : /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T12:00:00`
      : value;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CO", {
    day: monthOnly ? undefined : "numeric",
    month: monthOnly ? "short" : "short",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(date);
}

/**
 * Converts known report tokens into user-facing Spanish labels.
 * @param value Backend token to display.
 * @returns Human-readable label.
 */
export function humanizeToken(value: string): string {
  const labels: Record<string, string> = {
    realizada: "Realizada",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
    descartada: "Descartada",
    pendiente: "Pendiente",
    asignada: "Asignada",
    no_asistio: "No asistió",
    presencial: "Presencial",
    virtual: "Virtual",
    valoracion: "Valoración",
    paquete: "Paquete",
    APPROVED: "Aprobada",
    PENDING: "Pendiente",
    DECLINED: "Rechazada",
    NEQUI: "Nequi",
    PSE: "PSE",
  };
  return labels[value] ?? labels[value.toLocaleUpperCase("es-CO")] ?? value.replaceAll("_", " ");
}
