import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PendingContentNotice from "@/components/feedback/pending-content-notice";
import PublicFooter from "@/components/navigation/public-footer";
import PublicHeader from "@/components/navigation/public-header";
import { HOME_CONTENT } from "@/content/home";
import NewsBackdrop from "@/features/content/components/news-backdrop";
import NewsCard from "@/features/content/components/news-card";
import NewsPageNav from "@/features/content/components/news-page-nav";
import NewsPagination, { pageHref } from "@/features/content/components/news-pagination";
import { toNewsTeaser } from "@/features/content/format";
import { getPublicNews } from "@/features/content/services/public-content-service";

export const metadata: Metadata = { title: "Noticias | Fundación Dejando Huellas Felices" };

const PAGE_SIZE = 9;
const { news } = HOME_CONTENT;

function parsePage(rawPage: string | undefined) {
  if (rawPage === undefined) return 1;
  return /^\d+$/.test(rawPage) && Number(rawPage) >= 1 ? Number(rawPage) : null;
}

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = parsePage(Array.isArray(rawPage) ? rawPage[0] : rawPage);
  if (page === null) redirect("/noticias");

  const { items, total } = await getPublicNews(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) redirect(pageHref(totalPages));

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main data-motion="on" className="news-section relative isolate flex-1 overflow-x-clip">
        <NewsBackdrop />
        <div className="relative mx-auto w-full max-w-6xl px-6 py-12">
          <NewsPageNav
            back={{ href: "/", label: news.backHome }}
            crumbs={[{ label: news.home, href: "/" }, { label: news.pageTitle }]}
            label={news.breadcrumbs}
          />
          <header className="mt-10 text-center">
            <h1 className="font-display text-4xl font-extrabold text-wine md:text-5xl">{news.pageTitle}</h1>
            <span aria-hidden className="mx-auto mt-4 block h-1 w-16 rounded-full bg-wine/60" />
          </header>

          {items.length > 0 ? (
            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <NewsCard
                  key={item.id}
                  news={toNewsTeaser(item, 160)}
                  featuredLabel={news.featured}
                  variant="list"
                  linkLabel={news.readMore}
                  titleAs="h2"
                />
              ))}
            </div>
          ) : (
            <PendingContentNotice className="mt-10" />
          )}

          <NewsPagination page={page} totalPages={totalPages} labels={news} />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
