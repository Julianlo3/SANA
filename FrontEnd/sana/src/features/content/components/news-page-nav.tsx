import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import "../styles/news.css";

type Crumb = { label: string; href?: string };

/** Top row of the news pages: a clear way back plus the breadcrumb trail. */
export default function NewsPageNav({
  back,
  crumbs,
  label,
}: Readonly<{
  back: { href: string; label: string };
  crumbs: Crumb[];
  label: string;
}>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <Link
        href={back.href}
        className="news-focus inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-wine/25 bg-white/85 px-5 text-sm font-bold text-wine shadow-sm transition-colors hover:border-wine hover:bg-white"
      >
        <ArrowLeft size={16} aria-hidden />
        {back.label}
      </Link>
      <Breadcrumbs label={label} items={crumbs} />
    </div>
  );
}
