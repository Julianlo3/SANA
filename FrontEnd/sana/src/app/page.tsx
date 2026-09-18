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
import { HOME_CONTENT } from "@/content/home";

const { hero, about, programs, news, donation } = HOME_CONTENT;

/** Iconos de cada programa, en el mismo orden que el contenido. */
const PROGRAM_ICONS = [HeartHandshake, ShieldCheck, Users];

export default function HomePage() {
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
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-bold text-white transition hover:bg-primary-dark"
                >
                  <CalendarCheck size={18} />
                  {hero.primaryAction}
                </button>

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

              {about.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-5 leading-relaxed text-text-muted"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* PROGRAMAS */}
        <Wave aria-hidden className="w-full rotate-180 text-sidebar" />

        <section id="programs" className="bg-sidebar py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center font-display text-4xl font-extrabold text-primary-dark">
              {programs.title}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-center text-text-muted">
              {programs.description}
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {programs.items.map((program, index) => {
                const Icon = PROGRAM_ICONS[index] ?? HeartHandshake;

                return (
                  <article
                    key={program.title}
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
        </section>

        <Wave aria-hidden className="w-full text-sidebar" />

        {/* NOTICIAS */}
        <section id="news" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-4xl font-extrabold text-primary-dark">
            {news.title}
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {news.items.map((item, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <div className="flex h-40 items-center justify-center bg-surface-muted">
                  <p className="text-xs text-text-subtle">
                    {news.imagePlaceholder}
                  </p>
                </div>

                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                    {item.date}
                  </p>

                  <h3 className="mt-2 font-semibold text-text">{item.title}</h3>
                </div>
              </article>
            ))}
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