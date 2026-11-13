import PendingContentNotice from "@/components/feedback/pending-content-notice";
import { HOME_CONTENT } from "@/content/home";
import ValuesBackdrop from "@/features/content/components/values-backdrop";
import type { PublicContentCard } from "@/features/content/types/content-types";
import { pickValueIcon } from "@/features/content/values-path";

const { about } = HOME_CONTENT;

// 4-color cycle for node background and title color (large text, meets AA).
const STOP_TONES = [
  { node: "bg-accent-strong", title: "text-accent-strong" },
  { node: "bg-primary-dark", title: "text-primary-dark" },
  { node: "bg-wine", title: "text-wine" },
  { node: "bg-navy", title: "text-navy" },
];

// md+: segment of the straight center line inside each stop, node to node.
// On mobile the zigzag line is drawn with pseudo-elements (values.css).
function lineSegment(index: number, count: number) {
  if (count === 1) return null;
  if (index === 0) return "md:top-11 md:bottom-0";
  if (index === count - 1) return "md:top-0 md:h-11";
  return "md:inset-y-0";
}

export default function ValuesPath({
  values,
}: {
  values: PublicContentCard[];
}) {
  return (
    <section
      id="values"
      aria-labelledby="values-title"
      className="relative isolate overflow-hidden"
    >
      <ValuesBackdrop />

      <div className="mx-auto max-w-6xl px-6 pb-28 pt-24">
        <h2
          id="values-title"
          className="text-center font-display text-3xl font-extrabold text-accent sm:text-4xl"
        >
          {about.valuesTitle}
        </h2>

        {values.length === 0 ? (
          <PendingContentNotice className="mx-auto mt-6 max-w-xl justify-center" />
        ) : (
          <ul role="list" className="relative mx-auto mt-12 max-w-4xl">
            {values.map((value, index) => {
              const tone = STOP_TONES[index % STOP_TONES.length];
              const Icon = pickValueIcon(value.title, index);
              const textOnLeft = index % 2 === 1;
              const segment = lineSegment(index, values.length);

              return (
                <li
                  key={value.id}
                  className={`values-stop group relative grid gap-3 pb-[30px] md:grid-cols-[1fr_56px_1fr] md:gap-7 md:pb-4 md:pt-4 ${
                    textOnLeft ? "grid-cols-[1fr_44px] text-right" : "grid-cols-[44px_1fr]"
                  }`}
                >
                  {segment && (
                    <span
                      aria-hidden
                      className={`hidden border-l-[3px] border-dashed border-support-blue md:absolute md:left-1/2 md:block md:-translate-x-1/2 ${segment}`}
                    />
                  )}

                  <div
                    className={`relative z-10 row-start-1 grid h-11 w-11 place-items-center rounded-full text-white ring-[6px] ring-background md:col-start-2 md:h-14 md:w-14 md:justify-self-center motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:-rotate-6 motion-safe:group-hover:scale-110 ${textOnLeft ? "col-start-2" : "col-start-1"} ${tone.node}`}
                  >
                    <Icon aria-hidden className="h-5 w-5 md:h-6 md:w-6" />
                  </div>

                  <div
                    className={`row-start-1 min-w-0 ${
                      textOnLeft ? "col-start-1" : "col-start-2 md:col-start-3"
                    }`}
                  >
                    <h3
                      className={`mt-1.5 text-balance break-words font-display text-xl font-extrabold md:text-2xl ${tone.title}`}
                    >
                      {value.title}
                    </h3>
                    {value.description && (
                      <p
                        className={`mt-1.5 max-w-[46ch] whitespace-pre-line leading-relaxed text-text-muted ${
                          textOnLeft ? "ml-auto" : ""
                        }`}
                      >
                        {value.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
