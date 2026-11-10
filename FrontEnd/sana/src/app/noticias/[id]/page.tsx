import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicFooter from "@/components/navigation/public-footer";
import PublicHeader from "@/components/navigation/public-header";
import { HOME_CONTENT } from "@/content/home";
import MarkdownText from "@/features/content/components/markdown-text";
import NewsBackdrop from "@/features/content/components/news-backdrop";
import NewsCard from "@/features/content/components/news-card";
import NewsPageNav from "@/features/content/components/news-page-nav";
import NewsPhoto from "@/features/content/components/news-photo";
import { FeaturedChip, SeeAllLink } from "@/features/content/components/news-shared";
import { formatDate, toNewsTeaser } from "@/features/content/format";
import {
  getPublicNews,
  getPublicNewsItem,
} from "@/features/content/services/public-content-service";
import "@/features/content/styles/news.css";

type Props = { params: Promise<{ id: string }> };

const OTHER_NEWS_LIMIT = 3;
const { news: labels } = HOME_CONTENT;

async function findNews(rawId: string) {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? getPublicNewsItem(id) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const news = await findNews((await params).id);
  return { title: `${news?.title ?? "Noticia"} | Fundación Dejando Huellas Felices` };
}

export default async function NewsDetailPage({ params }: Props) {
  const news = await findNews((await params).id);
  if (!news) notFound();

  const { items } = await getPublicNews(1, OTHER_NEWS_LIMIT + 1);
  const others = items.filter((item) => item.id !== news.id).slice(0, OTHER_NEWS_LIMIT);

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main data-motion="on" className="news-section relative isolate w-full flex-1 overflow-x-clip py-12">
        <NewsBackdrop />
        <div className="relative mx-auto max-w-5xl px-6">
          <NewsPageNav
            back={{ href: "/noticias", label: labels.back }}
            crumbs={[
              { label: labels.home, href: "/" },
              { label: labels.pageTitle, href: "/noticias" },
              { label: news.title },
            ]}
            label={labels.breadcrumbs}
          />
        </div>

        <article className="relative mx-auto mt-10 max-w-3xl px-6">
          <header className="flex flex-col items-center text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {news.isPinned && <FeaturedChip label={labels.featured} />}
              <time
                dateTime={news.publishedAt}
                className="text-xs font-semibold uppercase tracking-wider text-accent-strong"
              >
                {formatDate(news.publishedAt)}
              </time>
            </div>
            <h1 className="mt-3 break-words font-display text-4xl font-extrabold leading-tight text-wine md:text-5xl">
              {news.title}
            </h1>
            <span aria-hidden className="mt-5 block h-1 w-16 rounded-full bg-wine/60" />
          </header>

          {news.imageUrl && (
            <div className="relative mt-8 aspect-[3/2] max-h-[480px] w-full overflow-hidden rounded-xl bg-highlight/50">
              <NewsPhoto
                src={news.imageUrl}
                alt={news.imageAlt ?? ""}
                sizes="(max-width: 768px) 100vw, 720px"
                priority
              />
            </div>
          )}

          <MarkdownText className="mx-auto mt-8 max-w-[68ch] text-lg leading-relaxed text-text [&_a]:text-wine [&_a:hover]:text-wine-dark [&_strong]:font-bold [&_strong]:text-wine">
            {news.body}
          </MarkdownText>
        </article>

        {others.length > 0 && (
          <section aria-labelledby="other-news-title" className="relative mx-auto mt-16 max-w-6xl px-6">
            <hr className="border-wine/15" />
            <h2 id="other-news-title" className="mt-12 text-center font-display text-2xl font-extrabold text-wine">
              {labels.otherNews}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((item) => (
                <NewsCard
                  key={item.id}
                  news={toNewsTeaser(item, 160)}
                  featuredLabel={labels.featured}
                  variant="list"
                  linkLabel={labels.readMore}
                />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <SeeAllLink label={labels.seeAll} />
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
