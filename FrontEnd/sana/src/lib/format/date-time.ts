/**
 * El backend entrega fechas ISO 8601 UTC. El formato para pantalla se resuelve
 * aquí, nunca se guarda ya formateado en el modelo de datos.
 */

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("es-CO", {
  numeric: "auto",
});

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

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