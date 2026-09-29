const DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "long",
  timeZone: "America/Bogota",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export function formatDate(isoDate: string): string {
  return DATE_FORMATTER.format(new Date(isoDate));
}

export function formatDateTime(isoDate: string): string {
  return DATE_TIME_FORMATTER.format(new Date(isoDate));
}

/** Plain-text excerpt of the limited Markdown used in news. */
export function toExcerpt(markdown: string, maxLength = 160): string {
  const text = markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}
