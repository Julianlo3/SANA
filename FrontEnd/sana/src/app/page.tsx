import Link from "next/link";
import { PawPrint, Star, Cloud, Wave } from "@/components/ui/shapes";
import {
  HeartHandshake,
  ShieldCheck,
  Users,
  CalendarCheck,
} from "lucide-react";
import PublicHeader from "@/components/navigation/public-header";
import PublicFooter from "@/components/navigation/public-footer";

const programs = [
  {
    icon: HeartHandshake,
    title: "Acompañamiento psicológico",
    description:
      "Texto pendiente: descripción del acompañamiento que ofrece la fundación huellitas.",
  },
  {
    icon: ShieldCheck,
    title: "Prevención",
    description:
      "Texto pendiente: descripción de los talleres y actividades de prevención.",
  },
  {
    icon: Users,
    title: "Apoyo a familias",
    description:
      "Texto pendiente: descripción del acompañamiento a familias y cuidadores.",
  },
];

const news = [
  { date: "Fecha pendiente", title: "Título de noticia pendiente" },
  { date: "Fecha pendiente", title: "Título de noticia pendiente" },
  { date: "Fecha pendiente", title: "Título de noticia pendiente" },
];

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
            <Star className="absolute right-10 bottom-24 w-7 text-accent-soft" />

            <PawPrint className="absolute -left-4 bottom-10 w-16 -rotate-12 text-primary-soft" />
            <PawPrint className="absolute left-20 bottom-24 w-10 rotate-12 text-primary-soft opacity-70" />
            <PawPrint className="absolute right-1/4 top-8 w-12 rotate-45 text-accent-soft" />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-primary-soft px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                Fundación sin ánimo de lucro
              </span>

              <h1 className="mt-6 font-display text-5xl font-bold leading-tight text-primary-dark sm:text-6xl">
                Únete a quienes ayudan a transformar la vida de las niñas y los
                niños
              </h1>

              <p className="mt-6 max-w-lg leading-relaxed text-text-muted">
                Texto pendiente: frase de presentación de la fundación, su
                propósito y a quiénes acompaña.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-bold text-white transition hover:bg-primary-dark"
                >
                  <CalendarCheck size={18} />
                  Solicitar una cita
                </button>

                <Link
                  href="#about"
                  className="rounded-full border border-border bg-surface px-7 py-3.5 font-bold text-text-muted transition hover:border-primary hover:text-primary"
                >
                  Conoce la fundación
                </Link>
              </div>
            </div>

            <div className="flex aspect-[4/3] items-center justify-center rounded-3xl border border-border bg-surface-muted">
              <p className="px-6 text-center text-sm text-text-subtle">
                Espacio reservado para imagen de la fundación
              </p>
            </div>
          </div>
        </section>

        {/* QUIÉNES SOMOS */}
        <section id="about" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="flex aspect-[4/3] items-center justify-center rounded-3xl border border-border bg-surface-muted">
              <p className="px-6 text-center text-sm text-text-subtle">
                Espacio reservado para imagen
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="font-display text-4xl font-bold text-primary-dark">
                        <Wave className="w-full text-sidebar" />
                Quiénes somos
              </h2>

              <p className="mt-5 leading-relaxed text-text-muted">
                Texto pendiente: historia de la fundación, año de creación,
                población que atiende y alcance de su trabajo.
              </p>

              <p className="mt-4 leading-relaxed text-text-muted">
                Texto pendiente: misión y valores de la organización.
              </p>
            </div>
          </div>
        </section>

        {/* PROGRAMAS */}
                <Wave className="w-full rotate-180 text-sidebar" />
        <section id="programs" className="bg-sidebar py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center font-display text-4xl font-bold text-primary-dark">
              Nuestros programas
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-center text-text-muted">
              Texto pendiente: introducción a los servicios de la fundación.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {programs.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-border bg-surface p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
                    <Icon size={22} />
                  </div>

                  <h3 className="mt-5 font-display text-xl font-bold text-text">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* NOTICIAS */}
        <section id="news" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-4xl font-bold text-primary-dark">
            Últimas noticias
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {news.map((item, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <div className="flex h-40 items-center justify-center bg-surface-muted">
                  <p className="text-xs text-text-subtle">
                    Imagen pendiente
                  </p>
                </div>

                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                    {item.date}
                  </p>

                  <h3 className="mt-2 font-semibold text-text">
                    {item.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* DONACIONES */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="rounded-3xl bg-primary px-8 py-14 text-center">
            <h2 className="font-display text-4xl font-bold text-white">
              Tu aporte transforma vidas
            </h2>

            <p className="mx-auto mt-4 max-w-lg leading-relaxed text-white/85">
              Texto pendiente: mensaje que invita a donar y explica en qué se
              usan los aportes.
            </p>

            <button
              type="button"
              className="mt-8 cursor-pointer rounded-full bg-accent px-8 py-3.5 font-bold text-white transition hover:bg-accent-strong"
            >
              Quiero donar
            </button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}