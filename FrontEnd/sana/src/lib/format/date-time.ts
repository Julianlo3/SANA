/**
 * The backend returns ISO 8601 UTC timestamps. Display formatting belongs here;
 * formatted values must not be stored in data models.
 */

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("es-CO", {
  numeric: "auto",
});

/**
 * Defines the units.
 */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

/**
 * Formats format relative date.
 * @param isoDate Date value.
 * @returns Formatted value or validation message.
 */
export function formatRelativeDate(isoDate: string | null): string {
  if (!isoDate) return "Nunca ha entrado";

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return "Fecha no disponible";

  const difference = timestamp - Date.now();

  for (const [unit, milliseconds] of UNITS) {
    if (Math.abs(difference) >= milliseconds) {
      return RELATIVE_FORMATTER.format(
        Math.round(difference / milliseconds),
        unit,
      );
    }
  }

  return "Hace un momento";
}