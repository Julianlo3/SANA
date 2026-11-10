"use client";

import { useRef, type ReactNode } from "react";
import NewsDeck, { type NewsDeckLabels } from "@/features/content/components/news-deck";
import { Doodle } from "@/features/content/components/news-doodles";
import NewsHighlights, { type NewsHighlightsLabels } from "@/features/content/components/news-highlights";
import { NewsStageSkeleton } from "@/features/content/components/news-section-skeleton";
import NewsShell from "@/features/content/components/news-shell";
import {
  useDesktop,
  useSectionEntrance,
  useTabVisible,
} from "@/features/content/hooks/use-section-motion";
import type { NewsTeaser } from "@/features/content/types/content-types";

type NewsSectionLabels = NewsDeckLabels &
  NewsHighlightsLabels & {
    title: string;
  };

export default function NewsSection({
  news,
  labels,
  emptyState,
}: {
  news: NewsTeaser[];
  labels: NewsSectionLabels;
  emptyState: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const { isInView, entrance } = useSectionEntrance(sectionRef);
  const isTabVisible = useTabVisible();
  const isDesktop = useDesktop();
  const isMoving = isInView && isTabVisible;

  const stage =
    isDesktop === null ? (
      <NewsStageSkeleton />
    ) : isDesktop ? (
      <NewsHighlights news={news} labels={labels} />
    ) : (
      <div className="news-stage mt-8 md:mt-10">
        <NewsDeck news={news} labels={labels} />
      </div>
    );

  return (
    <NewsShell sectionRef={sectionRef} entrance={entrance} isMoving={isMoving} title={labels.title}>
      {news.length > 0 ? (
        stage
      ) : (
        <div className="mt-8 flex items-center gap-4">
          <Doodle name="star" strokeWidth={1.5} className="h-12 w-12 shrink-0 text-[#d9a21b]/70" />
          {emptyState}
        </div>
      )}
    </NewsShell>
  );
}
