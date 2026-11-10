import type { NewsTeaser } from "@/features/content/types/content-types";

export type DoodleName = "star" | "heart" | "spiral" | "cloud" | "sun" | "squiggle";

const PATHS: Record<DoodleName, string> = {
  star: "M24 5c1.6 6.4 3.4 10.6 6 12.4 2.7 1.8 7 2.2 13 2.6-5 3-8.2 5.6-9 8.6-.9 3.3.6 8 3.2 14.4-5.4-3.8-9.4-5.8-12.6-5.6-3.3.2-7.2 2.6-12.8 6.6 2.2-6.2 3.2-10.8 2.2-14C13 27 9.6 24.4 4.6 21c6.2-.2 10.6-.8 13-2.6C20.2 16.6 22.2 12 24 5Z",
  heart:
    "M24 41C15 34.6 6.4 27.8 6.2 18.6 6 12.4 10.4 7.6 16 7.8c3.8.1 6.4 2.6 8 6 1.8-3.6 4.6-6.2 8.6-6.2 5.6 0 9.6 4.8 9.2 10.8-.6 9.2-9.2 16.4-17.8 22.6Z",
  spiral:
    "M25 24c0-1.6 1.8-2.4 3-1.4 2 1.6 1 5-1.4 5.8-3.6 1.2-7-1.8-6.8-5.4.2-5 5.4-8 10-6.8 6.2 1.6 8.6 9 5.8 14.4-3.6 7-13 8.8-19 4.4-7.6-5.6-7.4-17.4-.2-23C22.2 7.4 33.6 7 40.4 12.6",
  cloud:
    "M13 34c-4.8.2-8-3-8-6.8 0-3.8 3-6.6 6.8-6.6.6-5 4.8-8.6 9.6-8.4 3.6.1 6.6 2.2 8 5.4 1.2-.8 2.6-1.2 4.2-1.2 4.4.1 7.6 3.6 7.4 7.8 3 .4 5 2.8 4.8 5.6-.2 2.6-2.4 4.4-5 4.4Z",
  sun: "M24 16a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0-11v6m0 26v6M5 24h6m26 0h6M10.6 10.6l4.2 4.2m18.4 18.4 4.2 4.2m0-26.8-4.2 4.2M14.8 33.2l-4.2 4.2",
  squiggle: "M4 28c4-8 8-8 10 0s6 8 10 0 6-8 10 0 6 8 10 0",
};

export function Doodle({
  name,
  className = "",
  strokeWidth = 2,
}: Readonly<{
  name: DoodleName;
  className?: string;
  strokeWidth?: number;
}>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

const PAPERS = [
  { background: "var(--color-accent-soft)", ink: "var(--color-accent-strong)", doodle: "heart" },
  { background: "var(--color-primary-soft)", ink: "var(--color-primary-dark)", doodle: "cloud" },
  { background: "var(--color-highlight)", ink: "#a8741a", doodle: "star" },
] as const;

function paperFor(id: number) {
  return PAPERS[Math.abs(id) % PAPERS.length];
}

/** Decorative stand-in for a news item without a picture. */
export function NewsPaper({
  news,
  initialClassName = "text-7xl",
}: Readonly<{
  news: Pick<NewsTeaser, "id" | "title">;
  initialClassName?: string;
}>) {
  const paper = paperFor(news.id);
  const initial = Array.from(news.title.trim())[0]?.toUpperCase() ?? "";

  return (
    <div
      aria-hidden
      className="news-paper absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: paper.background, color: paper.ink }}
    >
      <Doodle
        name={paper.doodle}
        strokeWidth={1.4}
        className="absolute -right-[8%] -top-[10%] h-[70%] w-[70%] opacity-25"
      />
      <span className={`relative font-display font-extrabold leading-none ${initialClassName}`}>
        {initial}
      </span>
    </div>
  );
}
