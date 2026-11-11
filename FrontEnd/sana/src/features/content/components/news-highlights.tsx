import Link from "next/link";
import NewsCard from "@/features/content/components/news-card";
import { NewsPaper } from "@/features/content/components/news-doodles";
import NewsPhoto from "@/features/content/components/news-photo";
import { SeeAllLink } from "@/features/content/components/news-shared";
import { formatDate } from "@/features/content/format";
import type { NewsTeaser } from "@/features/content/types/content-types";

/**
 * Defines the news highlights labels type.
 */

export type NewsHighlightsLabels = {
  featured: string;
  readFull: string;
  seeAll: string;
};

/**
 * Renders the news row component.
 * @param props Component properties.
 * @returns Rendered component.
 */
function NewsRow({ news }: Readonly<{ news: NewsTeaser }>) {
  return (
    <Link
      href={`/noticias/${news.id}`}
      className="news-focus group grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-4 rounded-lg py-4"
    >
      <span className="relative block h-24 w-24 overflow-hidden rounded-lg bg-primary-soft">
        {news.imageUrl ? (
          <NewsPhoto src={news.imageUrl} alt={news.imageAlt ?? ""} sizes="96px" zoom />
        ) : (
          <NewsPaper news={news} initialClassName="text-4xl" />
        )}
      </span>
      <span className="min-w-0">
        <time
          dateTime={news.publishedAt}
          className="block text-xs font-semibold uppercase tracking-wider text-text-muted"
        >
          {formatDate(news.publishedAt)}
        </time>
        <span className="mt-1 line-clamp-2 break-words font-display text-base font-bold leading-snug text-text group-hover:text-wine">
          {news.title}
        </span>
      </span>
    </Link>
  );
}

/**
 * Desktop layout: the first news item (pinned or latest) as a large card and
 * the rest as compact rows beside it.
 * @param props Component properties.
 */
export default function NewsHighlights({
  news,
  labels,
}: Readonly<{
  news: NewsTeaser[];
  labels: NewsHighlightsLabels;
}>) {
  const [lead, ...rest] = news;
  const featured = (
    <NewsCard news={lead} featuredLabel={labels.featured} variant="featured" linkLabel={labels.readFull} />
  );

  if (rest.length === 0) {
    return (
      <div className="mx-auto mt-10 flex w-[70%] flex-col items-center gap-8">
        <div className="w-full">{featured}</div>
        <SeeAllLink label={labels.seeAll} />
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-[3fr_2fr] items-start gap-10">
      {featured}
      <div className="flex flex-col">
        <ul className="divide-y divide-wine/15">
          {rest.map((item) => (
            <li key={item.id}>
              <NewsRow news={item} />
            </li>
          ))}
        </ul>
        <SeeAllLink label={labels.seeAll} className="mt-6 self-start" />
      </div>
    </div>
  );
}
