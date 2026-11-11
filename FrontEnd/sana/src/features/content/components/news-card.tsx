import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NewsPaper } from "@/features/content/components/news-doodles";
import NewsPhoto from "@/features/content/components/news-photo";
import { FeaturedChip } from "@/features/content/components/news-shared";
import { formatDate } from "../format";
import type { NewsTeaser } from "../types/content-types";
import "../styles/news.css";

/**
 * Defines the linked variants.
 */
const LINKED_VARIANTS = {
  list: {
    sizes: "(min-width: 1152px) 360px, (min-width: 640px) 50vw, calc(100vw - 48px)",
    initial: "text-7xl",
    body: "p-5",
    title: "text-lg",
    excerpt: "text-sm",
  },
  featured: {
    sizes: "(min-width: 1152px) 660px, 60vw",
    initial: "text-[8rem]",
    body: "p-6",
    title: "text-2xl",
    excerpt: "text-base",
  },
};

/**
 * Defines the frame colors.
 */
const FRAME_COLORS = ["var(--color-primary)", "var(--color-support-pink)", "#d9a21b"];

/**
 * Defines the news card props type.
 */
type NewsCardProps = {
  news: NewsTeaser;
  featuredLabel: string;
  titleAs?: "h2" | "h3";
};

/**
 * Renders the deck card component.
 * @param props Component properties.
 * @returns Rendered component.
 */
function DeckCard({ news, featuredLabel, titleAs: Title = "h3" }: Readonly<NewsCardProps>) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[22px] bg-surface p-3 shadow-[0_18px_40px_-28px_rgba(19,65,118,0.5)]">
      <div className="relative h-[47%] shrink-0 overflow-hidden rounded-[16px_16px_56px_16px/16px_16px_40px_16px] bg-primary-soft">
        {news.imageUrl ? (
          <NewsPhoto
            src={news.imageUrl}
            alt={news.imageAlt ?? ""}
            sizes="(min-width: 768px) 45vw, calc(100vw - 60px)"
          />
        ) : (
          <NewsPaper news={news} initialClassName="text-7xl" />
        )}
        {news.isPinned && <FeaturedChip label={featuredLabel} className="absolute left-3 top-3" />}
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 pt-3 text-center">
        <time
          dateTime={news.publishedAt}
          className="text-xs font-semibold uppercase tracking-wider text-text-muted"
        >
          {formatDate(news.publishedAt)}
        </time>
        <Title className="mt-1.5 line-clamp-3 break-words font-display text-lg font-bold leading-snug text-text">
          {news.title}
        </Title>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">{news.excerpt}</p>
      </div>
    </article>
  );
}

/**
 * Card for a news item. The deck uses the paper note face; the list and the
 * featured item on the home page are links with a full-bleed photo.
 * @param props Component properties.
 */
export default function NewsCard({
  variant,
  linkLabel,
  ...props
}: NewsCardProps &
  ({ variant: "deck"; linkLabel?: never } | { variant: keyof typeof LINKED_VARIANTS; linkLabel: string })) {
  if (variant === "deck") return <DeckCard {...props} />;

  const { news, featuredLabel, titleAs: Title = "h3" } = props;
  const styles = LINKED_VARIANTS[variant];
  const isFeatured = variant === "featured";

  const card = (
    <article
      className={`flex h-full flex-col overflow-hidden bg-surface shadow-[0_10px_30px_-24px_rgba(19,65,118,0.45)] ${
        isFeatured ? "rounded-[13px]" : "rounded-xl"
      }`}
    >
      <div className="relative aspect-video shrink-0 overflow-hidden bg-primary-soft">
        {news.imageUrl ? (
          <NewsPhoto src={news.imageUrl} alt={news.imageAlt ?? ""} sizes={styles.sizes} zoom />
        ) : (
          <NewsPaper news={news} initialClassName={styles.initial} />
        )}
      </div>
      <div className={`flex flex-1 flex-col ${styles.body} ${isFeatured ? "" : "items-center text-center"}`}>
        {news.isPinned && (
          <FeaturedChip label={featuredLabel} className={`mb-3 ${isFeatured ? "self-start" : ""}`} />
        )}
        <time
          dateTime={news.publishedAt}
          className="text-xs font-semibold uppercase tracking-wider text-text-muted"
        >
          {formatDate(news.publishedAt)}
        </time>
        <Title
          className={`mt-1.5 line-clamp-2 break-words font-display font-bold leading-snug text-text group-hover:text-wine ${styles.title}`}
        >
          {news.title}
        </Title>
        <p className={`mt-2 line-clamp-3 leading-relaxed text-text-muted ${styles.excerpt}`}>{news.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-wine">
          {linkLabel}
          <ArrowRight size={16} aria-hidden />
        </span>
      </div>
    </article>
  );

  return (
    <Link
      href={`/noticias/${news.id}`}
      className={`news-focus news-card-lift group relative isolate block h-full ${
        isFeatured ? "rounded-2xl" : "rounded-xl"
      }`}
    >
      {isFeatured ? (
        <div className="news-frame h-full">{card}</div>
      ) : (
        <>
          <span
            aria-hidden
            className="news-card-frame"
            style={{ "--frame-color": FRAME_COLORS[news.id % FRAME_COLORS.length] } as CSSProperties}
          />
          {card}
        </>
      )}
    </Link>
  );
}
