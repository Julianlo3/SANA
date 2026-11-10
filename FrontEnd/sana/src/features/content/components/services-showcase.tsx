"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronRight } from "lucide-react";
import ServiceBackdrop, {
  BACKDROP_ACCENTS as ACCENTS,
} from "@/features/content/components/service-backdrop";
import { padNumber } from "@/features/content/format";
import type { PublicContentCard } from "@/features/content/types/content-types";

const NAVY = "#134176";
const PINK = "#eb5886";
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const DESKTOP_QUERY = "(min-width: 1024px)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ServicesShowcase({
  services,
}: {
  services: PublicContentCard[];
}) {
  const [active, setActive] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const detailRef = useRef<HTMLDivElement>(null);
  const hasAnimatedDetail = useRef(false);

  const currentIndex = Math.max(active, 0);
  const current = services[currentIndex] ?? services[0];
  const currentTheme = currentIndex % ACCENTS.length;
  const currentAccent = ACCENTS[currentTheme];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const indicator = indicatorRef.current;
    const list = indicator?.parentElement;
    if (!indicator || !list) return;

    const place = () => {
      const row = rowRefs.current[currentIndex]?.parentElement;
      if (!row) return;
      indicator.style.transform = `translateY(${row.offsetTop}px)`;
      indicator.style.height = `${row.offsetHeight}px`;
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [currentIndex]);

  useEffect(() => {
    const detail = detailRef.current;
    if (!detail) return;
    if (!hasAnimatedDetail.current) {
      hasAnimatedDetail.current = true;
      return;
    }
    if (prefersReducedMotion()) return;

    detail.querySelectorAll("[data-reveal]").forEach((element, order) =>
      element.animate(
        [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 550,
          delay: order * 60,
          easing: EASE_OUT,
          fill: "backwards",
        },
      ),
    );
  }, [currentIndex]);

  const handleSelect = (index: number) => {
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    setActive((currentActive) =>
      !isDesktop && currentActive === index ? -1 : index,
    );
  };

  const handleHover = (index: number) => {
    if (window.matchMedia(`${DESKTOP_QUERY} and (hover: hover)`).matches) {
      setActive(index);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step =
      event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (currentIndex + step + services.length) % services.length;
    setActive(next);
    rowRefs.current[next]?.focus();
  };

  return (
    <div
      ref={rootRef}
      className={`mt-12 rounded-[2rem] border border-white p-3 shadow-[0_30px_80px_-40px_rgba(19,65,118,0.35)] transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:p-4 lg:p-5 ${
        isRevealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{
        background:
          "linear-gradient(135deg, #fdeef3 0%, #eef7f8 55%, #e7effa 100%)",
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-5">
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label="Servicios"
          className="relative flex flex-col gap-1 lg:justify-center lg:py-3"
        >
          <div
            ref={indicatorRef}
            aria-hidden
            className="absolute inset-x-0 top-0 hidden rounded-2xl bg-white shadow-[0_8px_30px_-12px_rgba(19,65,118,0.3)] transition-[transform,height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:block"
          />

          {services.map((service, index) => {
            const isActive = active === index;
            const accent = ACCENTS[index % ACCENTS.length];

            return (
              <div
                key={service.id}
                className={`relative rounded-2xl transition-[opacity,translate,background-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                  isRevealed
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                } ${isActive ? "bg-white lg:bg-transparent" : ""}`}
                style={{
                  transitionDelay: isRevealed ? `${150 + index * 70}ms` : "0ms",
                }}
              >
                <button
                  ref={(element) => {
                    rowRefs.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`service-tab-${service.id}`}
                  aria-selected={isActive}
                  aria-controls={`service-panel-${service.id}`}
                  tabIndex={isActive || (active < 0 && index === 0) ? 0 : -1}
                  onMouseEnter={() => handleHover(index)}
                  onFocus={(event) => {
                    if (event.currentTarget.matches(":focus-visible")) {
                      setActive(index);
                    }
                  }}
                  onClick={() => handleSelect(index)}
                  onKeyDown={handleKeyDown}
                  className="group flex w-full cursor-pointer items-center gap-2 rounded-2xl px-4 py-4 text-left outline-none min-[380px]:gap-3 sm:gap-5 sm:px-5 focus-visible:ring-2 focus-visible:ring-[#eb5886]/60"
                >
                  <span
                    className="w-6 shrink-0 font-display text-sm font-bold tabular-nums min-[380px]:w-7 transition-colors duration-300"
                    style={{ color: isActive ? accent.strong : "#8296ac" }}
                  >
                    {padNumber(index + 1)}
                  </span>
                  <span
                    className={`min-w-0 flex-1 break-words font-display text-base font-bold leading-snug hyphens-auto transition-[color,translate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] min-[380px]:text-lg sm:text-xl ${
                      isActive ? "translate-x-1" : "group-hover:translate-x-1"
                    }`}
                    style={{ color: isActive ? PINK : NAVY }}
                  >
                    {service.title}
                  </span>
                  <ChevronRight
                    size={20}
                    aria-hidden
                    className={`shrink-0 transition-[opacity,translate,rotate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive
                        ? "translate-x-0 opacity-100 max-lg:rotate-90"
                        : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
                    }`}
                    style={{ color: PINK }}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
                    isActive
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <p className="overflow-hidden whitespace-pre-line px-4 pl-12 text-[15px] min-[380px]:pl-14 sm:px-5 sm:pl-17 leading-relaxed text-text-muted">
                    <span className="block pb-5">{service.description}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {current && (
          <div
            ref={detailRef}
            role="tabpanel"
            id={`service-panel-${current.id}`}
            aria-labelledby={`service-tab-${current.id}`}
            className="relative hidden min-h-[30rem] overflow-hidden rounded-3xl bg-white lg:block"
          >
            <ServiceBackdrop theme={currentTheme} />

            <div className="absolute inset-0 flex flex-col overflow-y-auto p-10 xl:p-12">
              <div className="relative my-auto text-center">
                <div
                  data-reveal
                  aria-hidden
                  className="mx-auto flex max-w-xs gap-1.5"
                >
                  {services.map((service, index) => (
                    <span
                      key={service.id}
                      className="h-1.5 flex-1 rounded-full transition-colors duration-500"
                      style={{
                        backgroundColor:
                          index === currentIndex
                            ? currentAccent.strong
                            : "rgba(19, 65, 118, 0.12)",
                      }}
                    />
                  ))}
                </div>
                <h3
                  data-reveal
                  className="mt-6 font-display text-3xl font-extrabold leading-tight xl:text-4xl"
                  style={{ color: NAVY }}
                >
                  {current.title}
                </h3>
                <span
                  data-reveal
                  aria-hidden
                  className="mx-auto mt-5 block h-1 w-14 rounded-full"
                  style={{ backgroundColor: PINK }}
                />
                {current.description && (
                  <p
                    data-reveal
                    lang="es"
                    className="mx-auto mt-6 max-w-xl whitespace-pre-line text-justify text-base leading-relaxed text-text-muted hyphens-auto"
                  >
                    {current.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
