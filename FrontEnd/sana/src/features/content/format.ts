import type { NewsTeaser, PublicNews } from "./types/content-types";

/**
 * Defines the date formatter.
 */
const DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "long",
  timeZone: "America/Bogota",
});

/**
 * Defines the date time formatter.
 */
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

/**
 * Formats format date.
 * @param isoDate Date value.
 * @returns Formatted value or validation message.
 */
export function formatDate(isoDate: string): string {
  return DATE_FORMATTER.format(new Date(isoDate));
}

/**
 * Formats format date time.
 * @param isoDate Date value.
 * @returns Formatted value or validation message.
 */
export function formatDateTime(isoDate: string): string {
  return DATE_TIME_FORMATTER.format(new Date(isoDate));
}

/**
 * Plain-text excerpt of the limited Markdown used in news.
 * @param markdown markdown input.
 * @param maxLength max length input. (optional)
 * @returns Result of the operation.
 */
export function toExcerpt(markdown: string, maxLength = 160): string {
  const text = markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength + 1);
  const lastSpace = cut.lastIndexOf(" ");
  const words = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut.slice(0, maxLength);
  return `${trimTrailingPunctuation(words)}…`;
}

/**
 * Defines the trailing characters.
 */
const TRAILING_CHARACTERS = new Set([" ", ".", ",", ";", ":"]);

/**
 * Implements the trim trailing punctuation operation.
 * @param text Text to process.
 * @returns Formatted value or validation message.
 */
function trimTrailingPunctuation(text: string): string {
  let end = text.length;
  while (end > 0 && TRAILING_CHARACTERS.has(text[end - 1])) end--;
  return text.slice(0, end);
}

/**
 * Converts to news teaser.
 * @param news news input.
 * @param excerptLength Optional. excerpt length input.
 * @returns Result of the operation.
 */
export function toNewsTeaser(news: PublicNews, excerptLength = 140): NewsTeaser {
  return {
    id: news.id,
    title: news.title,
    excerpt: toExcerpt(news.body, excerptLength),
    imageUrl: news.imageUrl,
    imageAlt: news.imageAlt,
    isPinned: news.isPinned,
    publishedAt: news.publishedAt,
  };
}

/**
 * Formats pad number.
 * @param value Value to process.
 * @returns Formatted value or validation message.
 */
export function padNumber(value: number): string {
  return String(value).padStart(2, "0");
}
