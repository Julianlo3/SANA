import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = {
  label: string;
  href?: string;
};

const MAX_LABEL = 48;

function shorten(label: string) {
  if (label.length <= MAX_LABEL) return label;
  const cut = label.slice(0, MAX_LABEL + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > MAX_LABEL * 0.6 ? cut.slice(0, lastSpace) : cut.slice(0, MAX_LABEL)).trimEnd()}…`;
}

/** Visible trail of links back to the parent pages; the last item is the current page. */
export default function Breadcrumbs({
  items,
  label,
  className = "",
}: Readonly<{
  items: Crumb[];
  label: string;
  className?: string;
}>) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, position) => {
          const isLast = position === items.length - 1;
          return (
            <li key={`${position}-${item.label}`} className="flex min-w-0 items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-sm font-semibold text-primary-dark underline-offset-4 transition-colors hover:text-wine hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-wine"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" title={item.label} className="truncate text-text-muted">
                  {shorten(item.label)}
                </span>
              )}
              {!isLast && <ChevronRight size={14} aria-hidden className="shrink-0 text-text-subtle" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
