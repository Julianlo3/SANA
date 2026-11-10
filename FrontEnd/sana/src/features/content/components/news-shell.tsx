import type { ReactNode, Ref } from "react";
import NewsBackdrop from "@/features/content/components/news-backdrop";
import SectionTitle from "@/features/content/components/section-title";
import "../styles/news.css";

const NEWS_TITLE_ID = "news-title";

export default function NewsShell({
  children,
  entrance,
  isMoving = false,
  title,
  sectionRef,
}: Readonly<{
  children: ReactNode;
  entrance?: string;
  isMoving?: boolean;
  title: string;
  sectionRef?: Ref<HTMLElement>;
}>) {
  return (
    <section
      ref={sectionRef}
      id="news"
      aria-labelledby={NEWS_TITLE_ID}
      data-entrance={entrance}
      data-motion={isMoving ? "on" : "off"}
      className="news-section relative isolate overflow-x-clip py-16 md:py-20"
    >
      <NewsBackdrop />
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionTitle id={NEWS_TITLE_ID} text={title} />
        {children}
      </div>
    </section>
  );
}
