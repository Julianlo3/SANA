import type { Metadata } from "next";
import Link from "next/link";
import PendingContentNotice from "@/components/feedback/pending-content-notice";
import PublicFooter from "@/components/navigation/public-footer";
import PublicHeader from "@/components/navigation/public-header";
import { HOME_CONTENT } from "@/content/home";
import NewsCard from "@/features/content/components/news-card";
import { getPublicNews } from "@/features/content/services/public-content-service";

export const metadata: Metadata = { title: "Noticias | Fundación Dejando Huellas Felices" };

const PAGE_SIZE = 9;
const { news } = HOME_CONTENT;

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const { items, total } = await getPublicNews(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <h1 className="font-display text-4xl font-extrabold text-primary-dark">
          {news.pageTitle}
        </h1>
        <p className="mt-3 max-w-xl text-text-muted">{news.pageDescription}</p>

        {items.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {items.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        ) : (
          <PendingContentNotice className="mt-10" />
        )}

        {totalPages > 1 && (
          <nav aria-label="Páginas de noticias" className="mt-10 flex items-center justify-center gap-4 text-sm">
            {page > 1 && (
              <Link href={`/noticias?page=${page - 1}`} className="font-semibold text-primary hover:text-primary-dark">
                Anteriores
              </Link>
            )}
            <span className="text-text-subtle">
              Página {page} de {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/noticias?page=${page + 1}`} className="font-semibold text-primary hover:text-primary-dark">
                Siguientes
              </Link>
            )}
          </nav>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
