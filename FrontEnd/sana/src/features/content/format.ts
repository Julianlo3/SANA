import type { NewsTeaser, PublicNews } from "./types/content-types";

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
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength + 1);
  const lastSpace = cut.lastIndexOf(" ");
  const words = lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut.slice(0, maxLength);
  return `${words.replace(/[\s.,;:]+$/, "")}…`;
}

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

export function padNumber(value: number): string {
  return String(value).padStart(2, "0");
}
