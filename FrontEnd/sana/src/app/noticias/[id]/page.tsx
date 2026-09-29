import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PublicFooter from "@/components/navigation/public-footer";
import PublicHeader from "@/components/navigation/public-header";
import { HOME_CONTENT } from "@/content/home";
import MarkdownText from "@/features/content/components/markdown-text";
import { formatDate } from "@/features/content/format";
import { getPublicNewsItem } from "@/features/content/services/public-content-service";

type Props = { params: Promise<{ id: string }> };

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

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <Link
          href="/noticias"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-text"
        >
          <ArrowLeft size={16} aria-hidden />
          {HOME_CONTENT.news.back}
        </Link>

        <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-accent-strong">
          {formatDate(news.publishedAt)}
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight text-primary-dark">
          {news.title}
        </h1>

        {news.imageUrl && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl">
            <Image
              src={news.imageUrl}
              alt={news.imageAlt ?? ""}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <MarkdownText className="mt-8 leading-relaxed text-text-muted">
          {news.body}
        </MarkdownText>
      </main>

      <PublicFooter />
    </div>
  );
}
