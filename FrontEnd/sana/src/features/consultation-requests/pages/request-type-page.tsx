import Link from "next/link";
import { ShieldCheck, User, Users } from "lucide-react";
import PageDecor from "@/components/ui/page-decor";
import PublicHeader from "@/components/navigation/public-header";
import PublicFooter from "@/components/navigation/public-footer";
import { REQUEST_CONTENT } from "@/content/consultation-request";

const { typeSelection } = REQUEST_CONTENT;

/** HU-2.2.1: la persona elige para quién es la atención. */
export default function RequestTypePage() {
  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="relative flex-1 overflow-hidden">
        <PageDecor variant="auth" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 py-20">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {typeSelection.eyebrow}
            </span>

            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-primary-dark">
              {typeSelection.title}
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-text-muted">
              {typeSelection.description}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <Link
              href="/solicitar-cita/adulto"
              className="group rounded-2xl border border-border bg-surface p-8 text-center transition hover:border-primary hover:shadow-sm"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <User size={24} aria-hidden />
              </span>

              <h2 className="mt-5 font-display text-xl font-bold text-text">
                {typeSelection.options.self.title}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                {typeSelection.options.self.description}
              </p>
            </Link>

            <Link
              href="/solicitar-cita/menor"
              className="group rounded-2xl border border-border bg-surface p-8 text-center transition hover:border-primary hover:shadow-sm"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
                <Users size={24} aria-hidden />
              </span>

              <h2 className="mt-5 font-display text-xl font-bold text-text">
                {typeSelection.options.guardian.title}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                {typeSelection.options.guardian.description}
              </p>
            </Link>
          </div>

          <p className="mx-auto mt-12 flex max-w-md items-start gap-2 text-center text-xs leading-relaxed text-text-subtle">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
            {typeSelection.confidentialityNote}
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}