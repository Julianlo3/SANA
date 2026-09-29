import Image from "next/image";
import Link from "next/link";
import {
  HeartHandshake,
  ShieldCheck,
  Users,
  CalendarCheck,
} from "lucide-react";
import { PawPrint, Star, Cloud, Wave } from "@/components/ui/shapes";
import PublicHeader from "@/components/navigation/public-header";
import PublicFooter from "@/components/navigation/public-footer";
import PendingContentNotice from "@/components/feedback/pending-content-notice";
import { HOME_CONTENT } from "@/content/home";
import NewsCard from "@/features/content/components/news-card";
import {
  getPublicContent,
  getPublicGallery,
  getPublicNews,
} from "@/features/content/services/public-content-service";

const { hero, about, programs, services, team, news, gallery, donation } =
  HOME_CONTENT;

/** Iconos de cada programa, en el mismo orden que el contenido. */
const PROGRAM_ICONS = [HeartHandshake, ShieldCheck, Users];

export default async function HomePage() {
  const [content, latestNews, galleryImages] = await Promise.all([
    getPublicContent(),
    getPublicNews(1, 3),
    getPublicGallery(),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <span className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-soft opacity-70" />
            <span className="absolute right-0 top-24 h-72 w-72 rounded-full bg-highlight opacity-60" />

            <Cloud className="absolute left-1/4 top-6 w-28 text-white opacity-90" />
            <Cloud className="absolute right-1/3 top-16 w-20 text-white opacity-70" />

            <Star className="absolute left-8 top-40 w-6 text-highlight" />
            <Star className="absolute left-1/3 top-24 w-4 text-accent opacity-60" />
            <Star className="absolute bottom-24 right-10 w-7 text-accent-soft" />

            <PawPrint className="absolute -left-4 bottom-10 w-16 -rotate-12 text-primary-soft" />
            <PawPrint className="absolute bottom-24 left-20 w-10 rotate-12 text-primary-soft opacity-70" />
            <PawPrint className="absolute right-1/4 top-8 w-12 rotate-45 text-accent-soft" />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-primary-soft px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                {hero.eyebrow}
              </span>

              <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight text-primary-dark sm:text-5xl">
                {hero.title}
              </h1>

              <p className="mt-6 max-w-lg leading-relaxed text-text-muted">
                {hero.description}
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                                <Link
                  href="/solicitar-cita"
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-bold text-white transition hover:bg-primary-dark"
                >
                  <CalendarCheck size={18} aria-hidden />
                  {hero.primaryAction}
                </Link>

                <Link
                  href="#about"
                  className="rounded-full border border-border bg-surface px-7 py-3.5 font-bold text-text-muted transition hover:border-primary hover:text-primary"
                >
                  {hero.secondaryAction}
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src={hero.image.src}
                alt={hero.image.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* QUIÉNES SOMOS */}
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
              <h2 className="font-display text-4xl font-extrabold text-primary-dark">
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
            <h3 className="font-display text-2xl font-bold text-primary-dark">
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

        {/* PROGRAMAS */}
        <section
          id="programs"
          className="relative overflow-hidden bg-sidebar py-24"
        >
          <Wave
            aria-hidden
            className="absolute inset-x-0 -top-px w-full rotate-180 text-background"
          />

          <div className="relative mx-auto max-w-6xl px-6">
            <h2 className="text-center font-display text-4xl font-extrabold text-primary-dark">
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
                    className="rounded-2xl border border-border bg-surface p-7"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
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

        <section id="services" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-4xl font-extrabold text-primary-dark">
            {services.title}
          </h2>

          {content.services.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {content.services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-2xl border border-border bg-surface p-7"
                >
                  <h3 className="font-display text-xl font-bold text-text">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    {service.description}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <PendingContentNotice className="mt-8" />
          )}
        </section>

        <section id="team" className="bg-sidebar py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-4xl font-extrabold text-primary-dark">
              {team.title}
            </h2>

            {content.team.length > 0 ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {content.team.map((member) => (
                  <article
                    key={member.id}
                    className="rounded-2xl border border-border bg-surface p-6 text-center"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft font-display text-xl font-bold text-primary">
                      {member.title.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="mt-4 font-semibold text-text">
                      {member.title}
                    </h3>
                    <p className="mt-1 text-sm text-accent-strong">
                      {member.subtitle}
                    </p>
                    {member.description && (
                      <p className="mt-3 text-sm leading-relaxed text-text-muted">
                        {member.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <PendingContentNotice className="mt-8" />
            )}
          </div>
        </section>

        {/* NOTICIAS */}
        <section id="news" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-4xl font-extrabold text-primary-dark">
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
                  className="mt-8 inline-block font-semibold text-primary hover:text-primary-dark"
                >
                  {news.seeAll}
                </Link>
              )}
            </>
          ) : (
            <PendingContentNotice className="mt-8" />
          )}
        </section>

        <section id="gallery" className="bg-sidebar py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-4xl font-extrabold text-primary-dark">
              {gallery.title}
            </h2>

            {galleryImages.length > 0 ? (
              <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
                {galleryImages.map((image) => (
                  <figure
                    key={image.id}
                    className="overflow-hidden rounded-2xl border border-border bg-surface"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={image.imageUrl}
                        alt={image.imageAlt}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    {image.caption && (
                      <figcaption className="px-4 py-3 text-sm text-text-muted">
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            ) : (
              <PendingContentNotice className="mt-8" />
            )}
          </div>
        </section>

        {/* DONACIONES */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-3xl">
            <Image
              src={donation.image.src}
              alt={donation.image.alt}
              fill
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
            />

            {/* Capa turquesa para que el texto se lea sobre la foto. */}
            <div className="absolute inset-0 bg-primary/85" />

            <div className="relative px-8 py-16 text-center">
              <h2 className="font-display text-4xl font-extrabold text-white">
                {donation.title}
              </h2>

              <p className="mx-auto mt-4 max-w-lg leading-relaxed text-white/90">
                {donation.description}
              </p>

              <button
                type="button"
                className="mt-8 cursor-pointer rounded-full bg-accent px-8 py-3.5 font-bold text-white transition hover:bg-accent-strong"
              >
                {donation.action}
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}