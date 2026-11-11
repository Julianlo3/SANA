import PendingContentNotice from "@/components/feedback/pending-content-notice";
import { HOME_CONTENT } from "@/content/home";
import NewsSection from "@/features/content/components/news-section";
import { toNewsTeaser } from "@/features/content/format";
import { getPublicNews } from "@/features/content/services/public-content-service";

/**
 * Defines the home news limit.
 */
const HOME_NEWS_LIMIT = 4;

/** Server side: loads the latest news and sends only teasers to the client section. */
export default async function HomeNews() {
  const { items } = await getPublicNews(1, HOME_NEWS_LIMIT);
  const teasers = items.slice(0, HOME_NEWS_LIMIT).map((item) => toNewsTeaser(item));

  return (
    <NewsSection
      news={teasers}
      labels={HOME_CONTENT.news}
      emptyState={<PendingContentNotice className="flex-1" />}
    />
  );
}
