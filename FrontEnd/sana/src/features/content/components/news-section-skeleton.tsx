import NewsShell from "@/features/content/components/news-shell";

function HighlightsSkeleton() {
  return (
    <div aria-hidden className="news-skeleton-shimmer mt-10 grid grid-cols-[3fr_2fr] items-start gap-10">
      <div className="overflow-hidden rounded-xl bg-surface">
        <span className="block aspect-video bg-primary-soft" />
        <div className="flex flex-col p-6">
          <span className="h-3 w-32 rounded bg-navy/10" />
          <span className="mt-3 h-6 w-11/12 rounded bg-navy/10" />
          <span className="mt-2 h-6 w-7/12 rounded bg-navy/10" />
          <span className="mt-4 h-4 w-full rounded bg-navy/10" />
          <span className="mt-2 h-4 w-10/12 rounded bg-navy/10" />
          <span className="mt-6 h-4 w-40 rounded bg-wine/15" />
        </div>
      </div>
      <div className="flex flex-col">
        <div className="divide-y divide-wine/15">
          {Array.from({ length: 3 }, (_, row) => (
            <div key={row} className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-4 py-4">
              <span className="h-24 w-24 rounded-lg bg-primary-soft" />
              <span className="flex flex-col gap-2">
                <span className="h-3 w-24 rounded bg-navy/10" />
                <span className="h-4 w-11/12 rounded bg-navy/10" />
                <span className="h-4 w-7/12 rounded bg-navy/10" />
              </span>
            </div>
          ))}
        </div>
        <span className="mt-6 h-11 w-64 rounded-full bg-wine/15" />
      </div>
    </div>
  );
}

function DeckSkeleton() {
  return (
    <div aria-hidden className="news-skeleton-shimmer flex h-full flex-col md:grid md:grid-cols-2 md:gap-8">
      <div className="flex min-h-0 flex-1 flex-col pb-[4.75rem] max-md:pb-[8.25rem] md:h-full">
        <div className="flex h-full flex-col rounded-[22px] bg-surface p-3">
          <span className="h-[47%] rounded-[16px_16px_56px_16px/16px_16px_40px_16px] bg-primary-soft" />
          <span className="mt-4 h-3 w-28 rounded bg-navy/10" />
          <span className="mt-3 h-4 w-11/12 rounded bg-navy/10" />
          <span className="mt-2 h-4 w-8/12 rounded bg-navy/10" />
        </div>
      </div>
      <div className="flex flex-col gap-3 max-md:hidden">
        {Array.from({ length: 4 }, (_, row) => (
          <span key={row} className="h-14 rounded-2xl bg-white/60" />
        ))}
      </div>
    </div>
  );
}

/** Same geometry as the loaded section, for every breakpoint, before the layout is known. */
export function NewsStageSkeleton() {
  return (
    <>
      <div className="hidden lg:block">
        <HighlightsSkeleton />
      </div>
      <div className="news-stage mt-8 md:mt-10 lg:hidden">
        <DeckSkeleton />
      </div>
    </>
  );
}

export default function NewsSectionSkeleton({ title }: Readonly<{ title: string }>) {
  return (
    <NewsShell title={title}>
      <NewsStageSkeleton />
    </NewsShell>
  );
}
