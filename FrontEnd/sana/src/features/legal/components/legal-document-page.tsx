import PolicyMarkdown from "@/components/legal/policy-markdown";
import PublicFooter from "@/components/navigation/public-footer";
import PublicHeader from "@/components/navigation/public-header";
import { LEGAL_CONTACT } from "@/content/legal";
import type { PolicyDocument } from "@/features/consultation-requests/services/policy-service";

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Bogota",
});

/** Public page that shows the current version of a legal document. */
export default function LegalDocumentPage({
  document,
  unavailableTitle,
}: {
  document: PolicyDocument | null;
  unavailableTitle: string;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        {document ? (
          <article>
            <PolicyMarkdown>{document.content}</PolicyMarkdown>
            <p className="mt-10 border-t border-border pt-6 text-xs text-text-subtle">
              Versión {document.version} · Publicada el{" "}
              {DATE_FORMAT.format(new Date(document.effectiveFrom))}
            </p>
          </article>
        ) : (
          <section>
            <h1 className="font-display text-3xl font-extrabold text-primary-dark">
              {unavailableTitle}
            </h1>
            <p className="mt-4 text-text-muted">
              No pudimos cargar el documento en este momento. Intenta de nuevo
              más tarde o escríbenos a{" "}
              <a
                href={`mailto:${LEGAL_CONTACT.email}`}
                className="font-semibold text-primary underline underline-offset-2"
              >
                {LEGAL_CONTACT.email}
              </a>
              .
            </p>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
