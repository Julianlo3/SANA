import Link from "next/link";
import { ArrowRight, Pin } from "lucide-react";
import type { NewsTeaser } from "@/features/content/types/content-types";

/**
 * Returns the index of the first pinned news item.
 * @param news News items to inspect.
 * @returns The first pinned item's index, or zero when none is pinned.
 */
export function defaultActiveIndex(news: Pick<NewsTeaser, "isPinned">[]) {
  return Math.max(0, news.findIndex((item) => item.isPinned));
}

/**
 * Renders the featured chip component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export function FeaturedChip({ label, className = "" }: Readonly<{ label: string; className?: string }>) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-highlight px-2.5 py-1 text-xs font-bold text-wine shadow-sm ${className}`}
    >
      <Pin size={12} aria-hidden />
      {label}
    </span>
  );
}

/**
 * Renders the see all link component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export function SeeAllLink({ label, className = "" }: Readonly<{ label: string; className?: string }>) {
  return (
    <Link
      href="/noticias"
      className={`news-focus inline-flex min-h-11 items-center gap-2 rounded-full bg-wine px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-md transition hover:scale-105 hover:bg-wine-dark active:scale-95 ${className}`}
    >
      {label}
      <ArrowRight size={16} aria-hidden />
    </Link>
  );
}
