"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronRight } from "lucide-react";
import { padNumber } from "@/features/content/format";
import type { PublicContentCard } from "@/features/content/types/content-types";

/**
 * Defines the navy.
 */
const NAVY = "#134176";
/**
 * Defines the pink.
 */
const PINK = "#eb5886";
/**
 * Number color of the active row, cycled per service.
 */
const ACCENTS = ["#eb5886", "#2e8c96", "#134176", "#d9a21b"];
/**
 * Top bar color of each desktop card, cycled per service.
 */
const CARD_BARS = ["bg-accent", "bg-primary", "bg-navy", "bg-support-pink"];

/**
 * Renders the services showcase component: an accordion on mobile and a card grid on desktop.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function ServicesShowcase({
  services,
}: {
  services: PublicContentCard[];
}) {
  const [active, setActive] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentIndex = Math.max(active, 0);

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

  const handleSelect = (index: number) => {
    setActive((currentActive) => (currentActive === index ? -1 : index));
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

  const revealClass = isRevealed
    ? "translate-y-0 opacity-100"
    : "translate-y-4 opacity-0";
  const revealDelay = (index: number) => ({
    transitionDelay: isRevealed ? `${150 + index * 70}ms` : "0ms",
  });

  return (
    <div
      ref={rootRef}
      className={`mt-12 rounded-[2rem] border border-white p-3 shadow-[0_30px_80px_-40px_rgba(19,65,118,0.35)] transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:p-4 lg:p-6 ${
        isRevealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{
        background:
          "linear-gradient(135deg, #fdeef3 0%, #eef7f8 55%, #e7effa 100%)",
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:hidden">
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label="Servicios"
          className="relative flex flex-col gap-1"
        >
          {services.map((service, index) => {
            const isActive = active === index;
            const accent = ACCENTS[index % ACCENTS.length];

            return (
              <div
                key={service.id}
                className={`relative rounded-2xl transition-[opacity,translate,background-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${revealClass} ${
                  isActive ? "bg-white" : ""
                }`}
                style={revealDelay(index)}
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
                    style={{ color: isActive ? accent : "#8296ac" }}
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
                        ? "translate-x-0 rotate-90 opacity-100"
                        : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
                    }`}
                    style={{ color: PINK }}
                  />
                </button>

                <div
                  id={`service-panel-${service.id}`}
                  role="tabpanel"
                  aria-labelledby={`service-tab-${service.id}`}
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
      </div>

      <ul role="list" className="hidden gap-5 lg:grid lg:grid-cols-3">
        {services.map((service, index) => (
          <li
            key={service.id}
            className={`relative flex flex-col overflow-hidden rounded-2xl bg-white p-7 shadow-[0_12px_32px_-18px_rgba(19,65,118,0.35)] transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${revealClass}`}
            style={revealDelay(index)}
          >
            <span
              aria-hidden
              className={`absolute inset-x-0 top-0 h-1.5 ${CARD_BARS[index % CARD_BARS.length]}`}
            />
            <span
              className="font-display text-sm font-bold tabular-nums"
              style={{ color: PINK }}
            >
              {padNumber(index + 1)}
            </span>
            <h3
              className="mt-2 break-words font-display text-xl font-bold leading-snug hyphens-auto"
              style={{ color: NAVY }}
            >
              {service.title}
            </h3>
            {service.description && (
              <p
                lang="es"
                className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-text-muted hyphens-auto"
              >
                {service.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
