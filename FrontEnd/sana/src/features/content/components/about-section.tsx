import Image from "next/image";
import PendingContentNotice from "@/components/feedback/pending-content-notice";
import { HOME_CONTENT } from "@/content/home";
import MissionVisionTabs from "@/features/content/components/mission-vision-tabs";
import type { PublicContent } from "@/features/content/types/content-types";

const { about } = HOME_CONTENT;

type AboutSectionProps = Pick<PublicContent, "mission" | "vision">;

export default function AboutSection({ mission, vision }: AboutSectionProps) {
  const cards = [
    {
      key: "mission",
      title: about.missionTitle,
      text: mission,
      cardClass: "mv-card--mission",
      titleClass: "text-primary-dark",
    },
    {
      key: "vision",
      title: about.visionTitle,
      text: vision,
      cardClass: "mv-card--vision",
      titleClass: "text-accent-strong",
    },
  ];

  return (
    <section id="about" className="mx-auto max-w-6xl px-6 pb-4 pt-20">
      {/* Image band with the section title on top */}
      <div className="relative aspect-[16/9] min-h-[220px] w-full overflow-hidden rounded-3xl sm:aspect-[2/1] lg:aspect-[21/8]">
        <Image
          src={about.image.src}
          alt={about.image.alt}
          fill
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-cover object-[center_45%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-r from-navy/75 via-navy/30 to-transparent"
        />
        <h2 className="absolute bottom-14 left-6 right-6 text-balance font-display text-3xl font-extrabold text-white sm:left-10 sm:text-4xl lg:bottom-20 lg:text-5xl">
          {about.title}
        </h2>
      </div>

      {/* Mobile: a single card with tabs */}
      <div className="relative z-10 -mt-10 sm:-mt-12 md:hidden">
        <MissionVisionTabs
          mission={mission}
          vision={vision}
          missionTitle={about.missionTitle}
          visionTitle={about.visionTitle}
        />
      </div>

      {/* Desktop: mission and vision side by side, overlapping the band */}
      <div className="relative z-10 hidden items-stretch gap-6 md:-mt-12 md:grid md:grid-cols-2 md:px-6 lg:-mt-16 lg:px-10">
        {cards.map((card) => (
          <article
            key={card.key}
            className={`mv-card ${card.cardClass} rounded-[26px] px-7 py-8 sm:px-8`}
          >
            <h3
              className={`text-center font-display text-2xl font-extrabold ${card.titleClass}`}
            >
              {card.title}
            </h3>
            {card.text ? (
              <p className="mt-3 hyphens-auto whitespace-pre-line text-justify leading-relaxed text-text-muted">
                {card.text}
              </p>
            ) : (
              <PendingContentNotice className="mt-3" />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
