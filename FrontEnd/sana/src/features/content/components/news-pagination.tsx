import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/news.css";

type PageItem = number | "gap";

/** Page numbers around the current one, always keeping the first and the last. */
function pageItems(current: number, total: number): PageItem[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  return sorted.flatMap((page, position) => {
    const previous = sorted[position - 1];
    if (previous === undefined || page - previous === 1) return [page];
    if (page - previous === 2) return [previous + 1, page];
    return ["gap" as const, page];
  });
}

export function pageHref(page: number) {
  return page <= 1 ? "/noticias" : `/noticias?page=${page}`;
}

const ITEM =
  "news-focus inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold transition";

function PageItemView({ item, current }: Readonly<{ item: PageItem; current: number }>) {
  if (item === "gap") {
    return (
      <span aria-hidden className="px-1 text-text-muted">
        …
      </span>
    );
  }
  if (item === current) {
    return (
      <span aria-current="page" className={`${ITEM} bg-wine text-white shadow-md`}>
        {item}
      </span>
    );
  }
  return (
    <Link href={pageHref(item)} className={`${ITEM} text-text hover:bg-wine/10 hover:text-wine`}>
      {item}
    </Link>
  );
}

export default function NewsPagination({
  page,
  totalPages,
  labels,
}: Readonly<{
  page: number;
  totalPages: number;
  labels: { pagination: string; previousPage: string; nextPage: string };
}>) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={labels.pagination} className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link href={pageHref(page - 1)} rel="prev" className={`${ITEM} gap-1 text-wine hover:bg-wine/10`}>
              <ChevronLeft size={16} aria-hidden />
              {labels.previousPage}
            </Link>
          ) : (
            <span aria-disabled="true" className={`${ITEM} gap-1 text-text-subtle`}>
              <ChevronLeft size={16} aria-hidden />
              {labels.previousPage}
            </span>
          )}
        </li>

        {pageItems(page, totalPages).map((item, position) => (
          <li key={item === "gap" ? `gap-${position}` : item}>
            <PageItemView item={item} current={page} />
          </li>
        ))}

        <li>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} rel="next" className={`${ITEM} gap-1 text-wine hover:bg-wine/10`}>
              {labels.nextPage}
              <ChevronRight size={16} aria-hidden />
            </Link>
          ) : (
            <span aria-disabled="true" className={`${ITEM} gap-1 text-text-subtle`}>
              {labels.nextPage}
              <ChevronRight size={16} aria-hidden />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
