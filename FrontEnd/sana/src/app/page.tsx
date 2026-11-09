import Image from "next/image";
import Link from "next/link";
import {
  HeartHandshake,
  ShieldCheck,
  Users,
  CalendarCheck,
} from "lucide-react";
import { Wave } from "@/components/ui/shapes";
import PublicHeader from "@/components/navigation/public-header";
import PublicFooter from "@/components/navigation/public-footer";
import PendingContentNotice from "@/components/feedback/pending-content-notice";
import { HOME_CONTENT } from "@/content/home";
import GallerySection from "@/features/content/components/gallery-section";
import HeroCarousel from "@/features/content/components/hero-carousel";
import NewsCard from "@/features/content/components/news-card";
import ServicesShowcase from "@/features/content/components/services-showcase";
import TeamSection from "@/features/content/components/team-section";
import TeamWatermark from "@/features/content/components/team-watermark";
import {
  getPublicBanners,
  getPublicContent,
  getPublicGallery,
  getPublicNews,
} from "@/features/content/services/public-content-service";

const { hero, about, programs, services, team, news, gallery, donation } =
  HOME_CONTENT;

const PROGRAM_ICONS = [HeartHandshake, ShieldCheck, Users];

const COLORS = {
  pink: "#eb5886",
};

export default async function HomePage() {
  const [content, latestNews, galleryImages, banners] = await Promise.all([
    getPublicContent(),
    getPublicNews(1, 3),
    getPublicGallery(),
    getPublicBanners(),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO — filtro azul */}
        <HeroCarousel
          slides={banners.map((banner) => ({
            key: String(banner.id),
            src: banner.imageUrl,
            alt: banner.imageAlt,
          }))}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-navy/70" />

          <div className="relative flex w-full items-center justify-center px-11 py-8 text-center sm:px-24 sm:py-12">
            <div className="mx-auto max-w-3xl">
              <p className="font-display text-xs font-bold uppercase tracking-wide text-white sm:text-lg">
                {hero.eyebrow}
              </p>

              <h1 className="mt-1 font-display text-2xl font-extrabold uppercase leading-tight text-white min-[400px]:text-3xl sm:text-5xl">
                {hero.title}
              </h1>

              <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-white sm:text-sm">
                {hero.description}
              </p>

              <Link
                href="/solicitar-cita"
                className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-navy sm:px-6"
              >
                <CalendarCheck size={16} aria-hidden />
                {hero.primaryAction}
              </Link>
            </div>
          </div>
        </HeroCarousel>

        {/* QUIÉNES SOMOS — blanco, acentos rosa */}
        <section id="about" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src={about.image.src}
                alt={about.image.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-center">
              <h2
                className="font-display text-4xl font-extrabold"
                style={{ color: COLORS.pink }}
              >
                {about.title}
              </h2>

              {[
                { title: about.missionTitle, text: content.mission },
                { title: about.visionTitle, text: content.vision },
              ].map((block) => (
                <div key={block.title} className="mt-6">
                  <h3 className="font-display text-xl font-bold text-text">
                    {block.title}
                  </h3>
                  {block.text ? (
                    <p className="mt-2 whitespace-pre-line leading-relaxed text-text-muted">
                      {block.text}
                    </p>
                  ) : (
                    <PendingContentNotice className="mt-3" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14">
            <h3
              className="font-display text-2xl font-bold"
              style={{ color: COLORS.pink }}
            >
              {about.valuesTitle}
            </h3>

            {content.values.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {content.values.map((value) => (
                  <article
                    key={value.id}
                    className="rounded-2xl border border-border bg-surface p-5"
                  >
                    <h4 className="font-semibold text-text">{value.title}</h4>
                    {value.description && (
                      <p className="mt-2 text-sm leading-relaxed text-text-muted">
                        {value.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <PendingContentNotice className="mt-4" />
            )}
          </div>
        </section>

        {/* PROGRAMAS — celeste */}
        <section
          id="programs"
          className="relative overflow-hidden bg-support-blue py-24"
        >
          <Wave
            aria-hidden
            className="absolute inset-x-0 -top-px w-full rotate-180 text-background"
          />

          <div className="relative mx-auto max-w-6xl px-6">
            <h2 className="text-center font-display text-4xl font-extrabold text-navy">
              {programs.title}
            </h2>

            {content.programs.length === 0 && (
              <PendingContentNotice className="mx-auto mt-10 max-w-xl justify-center" />
            )}

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {content.programs.map((program, index) => {
                const Icon =
                  PROGRAM_ICONS[index % PROGRAM_ICONS.length] ?? HeartHandshake;

                return (
                  <article
                    key={program.id}
                    className="bg-white p-7"
                  >
                    <div className="flex h-12 w-12 items-center justify-center bg-navy text-white">
                      <Icon size={22} aria-hidden />
                    </div>

                    <h3 className="mt-5 font-display text-xl font-bold text-text">
                      {program.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-text-muted">
                      {program.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <Wave
            aria-hidden
            className="absolute inset-x-0 -bottom-px w-full text-background"
          />
        </section>

        {/* SERVICIOS — blanco */}
        <section id="services" className="mx-auto max-w-6xl px-6 py-20">
          <h2
            className="font-display text-4xl font-extrabold"
            style={{ color: COLORS.pink }}
          >
            {services.title}
          </h2>

          {content.services.length > 0 ? (
            <ServicesShowcase services={content.services} />
          ) : (
            <PendingContentNotice className="mt-8" />
          )}
        </section>

        {/* EQUIPO — azul marino */}
        <section
          id="team"
          aria-label={team.title}
          className="relative isolate overflow-x-clip bg-navy py-20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(67,172,182,0.35),transparent_45%),radial-gradient(circle_at_90%_85%,rgba(235,88,134,0.18),transparent_40%)]"
          />
          <TeamWatermark />
          <div className="relative mx-auto max-w-6xl px-6">
            {content.team.length > 0 ? (
              <TeamSection
                members={content.team}
                titles={{
                  staff: team.staffTitle,
                  professional: team.professionalTitle,
                }}
              />
            ) : (
              <>
                <h2 className="font-display text-4xl font-extrabold text-white">
                  {team.title}
                </h2>
                <PendingContentNotice className="mt-8" />
              </>
            )}
          </div>
        </section>

        {/* NOTICIAS — blanco */}
        <section id="news" className="mx-auto max-w-6xl px-6 py-20">
          <h2
            className="font-display text-4xl font-extrabold"
            style={{ color: COLORS.pink }}
          >
            {news.title}
          </h2>

          {latestNews.items.length > 0 ? (
            <>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {latestNews.items.map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
              {latestNews.total > latestNews.items.length && (
                <Link
                  href="/noticias"
                  className="mt-8 inline-block font-semibold transition"
                  style={{ color: COLORS.pink }}
                >
                  {news.seeAll}
                </Link>
              )}
            </>
          ) : (
            <PendingContentNotice className="mt-8" />
          )}
        </section>

        {/* GALERÍA — rosa suave */}
        <GallerySection
          images={galleryImages}
          labels={gallery}
          emptyState={<PendingContentNotice className="mt-8" />}
        />

        {/* DONACIONES — rosa */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-20">
          <div className="relative overflow-hidden rounded-3xl">
            <Image
              src={donation.image.src}
              alt={donation.image.alt}
              fill
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
            />

            <div
              className="absolute inset-0"
              style={{ backgroundColor: `${COLORS.pink}d9` }}
            />

            <div className="relative px-8 py-16 text-center">
              <h2 className="font-display text-4xl font-extrabold text-white">
                {donation.title}
              </h2>

              <p className="mx-auto mt-4 max-w-lg leading-relaxed text-white/90">
                {donation.description}
              </p>

              <Link
                href="/donaciones"
                className="mt-8 inline-flex items-center justify-center cursor-pointer rounded-full bg-white px-8 py-3.5 font-bold shadow-md transition hover:bg-white/95 hover:scale-105 active:scale-95"
                style={{ color: COLORS.pink }}
              >
                {donation.action}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
