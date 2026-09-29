import Image from "next/image";
import Link from "next/link";
import { formatDate, toExcerpt } from "../format";
import type { PublicNews } from "../types/content-types";

export default function NewsCard({ news }: { news: PublicNews }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface">
      <Link href={`/noticias/${news.id}`} className="block">
        <div className="relative h-44 bg-surface-muted">
          {news.imageUrl ? (
            <Image
              src={news.imageUrl}
              alt={news.imageAlt ?? ""}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition group-hover:scale-105"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-bold text-primary/30">
              SANA
            </span>
          )}
        </div>

        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
            {formatDate(news.publishedAt)}
          </p>
          <h3 className="mt-2 font-semibold text-text group-hover:text-primary">
            {news.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-muted">
            {toExcerpt(news.body)}
          </p>
        </div>
      </Link>
    </article>
  );
}
