"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import TeamMemberSpotlight from "@/features/content/components/team-member-spotlight";
import type { PublicContentCard } from "@/features/content/types/content-types";

const ROTATION_MS = 2000;
const SLIDE_MS = 900;
const FADE_OUT_MS = 400;
const FADE_IN_MS = 600;
const FADE_IN_DELAY_MS = 300;
const RETURN_FADE_MS = 250;
const HOVER_INTENT_MS = 220;
const GAP_PX = 24;

const NAVY = "#134176";
const NAVY_SOFT = "#b5d4f4";
const PINK = "#eb5886";

type CardState = "open" | "returning" | "in-view" | "out-of-view";

function cardTransition(animate: boolean, state: CardState) {
  if (!animate) return "none";
  const hover =
    "translate 500ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 500ms ease-out";
  const scale = `scale ${SLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;
  const opacity = {
    open: "opacity 0ms",
    returning: `opacity ${RETURN_FADE_MS}ms ease-out`,
    "in-view": `opacity ${FADE_IN_MS}ms ease-out ${FADE_IN_DELAY_MS}ms`,
    "out-of-view": `opacity ${FADE_OUT_MS}ms ease-out`,
  }[state];
  return `${opacity}, ${scale}, ${hover}`;
}

type Spotlight = {
  member: PublicContentCard;
  origin: HTMLElement;
  viaKeyboard: boolean;
  isClosing: boolean;
};

function useVisibleCount() {
  const [count, setCount] = useState(4);

  useEffect(() => {
    const queries = [
      { media: window.matchMedia("(min-width: 1024px)"), value: 4 },
      { media: window.matchMedia("(min-width: 768px)"), value: 3 },
      { media: window.matchMedia("(min-width: 640px)"), value: 2 },
    ];
    const update = () =>
      setCount(queries.find((query) => query.media.matches)?.value ?? 1);

    update();
    queries.forEach((query) => query.media.addEventListener("change", update));
    return () =>
      queries.forEach((query) =>
        query.media.removeEventListener("change", update),
      );
  }, []);

  return count;
}

export default function TeamCarousel({
  members,
}: {
  members: PublicContentCard[];
}) {
  const visible = useVisibleCount();
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const intentTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hoveredCard = useRef<{
    member: PublicContentCard;
    origin: HTMLElement;
  } | null>(null);
  const lastClosedId = useRef<number | null>(null);

  const isCarousel = members.length > visible;
  const isPaused = hoveredId !== null || isFocused || spotlight !== null;
  const track = isCarousel
    ? [...members, ...members.slice(0, visible)]
    : members;

  const offset = isCarousel ? Math.min(index, members.length) : 0;

  useEffect(() => {
    if (!isCarousel || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setTimeout(() => {
      setAnimate(true);
      setIndex((current) => current + 1);
    }, ROTATION_MS);
    return () => clearTimeout(timer);
  }, [index, isCarousel, isPaused]);

  useEffect(() => {
    if (animate) return;
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimate(true)),
    );
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  useEffect(() => {
    if (!isCarousel || index < members.length) return;
    const timer = setTimeout(() => {
      setAnimate(false);
      setIndex((current) => current - members.length);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, isCarousel, members.length]);

  useEffect(() => () => clearTimeout(intentTimer.current), []);

  const showNext = () => {
    setAnimate(true);
    setIndex((current) => Math.min(current + 1, members.length));
  };

  const showPrevious = () => {
    if (index > 0) {
      setAnimate(true);
      setIndex(index - 1);
      return;
    }
    setAnimate(false);
    setIndex(members.length);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimate(true);
        setIndex(members.length - 1);
      }),
    );
  };

  const openSpotlight = (
    member: PublicContentCard,
    origin: HTMLElement,
    viaKeyboard = false,
  ) => {
    clearTimeout(intentTimer.current);
    setSpotlight(
      (current) => current ?? { member, origin, viaKeyboard, isClosing: false },
    );
  };

  const scheduleIntent = (member: PublicContentCard, origin: HTMLElement) => {
    clearTimeout(intentTimer.current);
    intentTimer.current = setTimeout(
      () => openSpotlight(member, origin),
      HOVER_INTENT_MS,
    );
  };

  const handleMouseEnter = (member: PublicContentCard, origin: HTMLElement) => {
    hoveredCard.current = { member, origin };
    setHoveredId(member.id);
    if (member.id !== lastClosedId.current) scheduleIntent(member, origin);
  };

  const handleMouseLeave = (member: PublicContentCard) => {
    hoveredCard.current = null;
    if (member.id === lastClosedId.current) lastClosedId.current = null;
    setHoveredId(null);
    clearTimeout(intentTimer.current);
  };

  const handleSpotlightCloseStart = () => {
    lastClosedId.current = spotlight?.member.id ?? null;
    clearTimeout(intentTimer.current);
    setSpotlight((current) => current && { ...current, isClosing: true });
  };

  const handleSpotlightClosed = () => {
    const hovered = hoveredCard.current;
    setSpotlight(null);
    if (hovered && hovered.member.id !== lastClosedId.current) {
      scheduleIntent(hovered.member, hovered.origin);
    }
  };

  return (
    <div
      aria-roledescription="carrusel"
      aria-label="Nuestro equipo"
      className="relative mt-10"
      onFocus={(event) =>
        setIsFocused(
          event.currentTarget.contains(event.target) &&
            event.target.matches(":focus-visible"),
        )
      }
      onBlur={() => setIsFocused(false)}
    >
      <div className="py-6">
        <div
          className={`flex ${isCarousel ? "" : "justify-center"}`}
          style={{
            gap: GAP_PX,
            transform: `translateX(calc(${-offset} * (100% + ${GAP_PX}px) / ${visible}))`,
            transition: animate
              ? `transform ${SLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`
              : "none",
          }}
        >
          {track.map((member, position) => {
            const isClone = position >= members.length;
            const isSpotlit = spotlight?.member.id === member.id;
            const isOpen = isSpotlit && !spotlight?.isClosing;
            const isInView = position >= offset && position < offset + visible;
            const state: CardState = isOpen
              ? "open"
              : isSpotlit
                ? "returning"
                : isInView
                  ? "in-view"
                  : "out-of-view";

            return (
              <article
                key={`${member.id}-${position}`}
                aria-hidden={isClone || undefined}
                tabIndex={isClone ? -1 : 0}
                aria-label={[member.title, member.subtitle]
                  .filter(Boolean)
                  .join(", ")}
                onMouseEnter={(event) =>
                  handleMouseEnter(member, event.currentTarget)
                }
                onMouseLeave={() => handleMouseLeave(member)}
                onClick={(event) => openSpotlight(member, event.currentTarget)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSpotlight(member, event.currentTarget, true);
                  }
                }}
                className={`group relative aspect-[3/4] shrink-0 cursor-pointer overflow-hidden rounded-2xl shadow-lg outline-none hover:-translate-y-1.5 hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-white/60 ${
                  isInView ? "scale-100" : "scale-95"
                } ${isInView && !isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
                style={{
                  flexBasis: `calc((100% - ${(visible - 1) * GAP_PX}px) / ${visible})`,
                  backgroundColor: NAVY_SOFT,
                  transition: cardTransition(animate, state),
                }}
              >
                {member.imageUrl ? (
                  <Image
                    src={member.imageUrl}
                    alt={member.imageAlt ?? member.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                ) : (
                  <span
                    className="absolute inset-0 flex items-center justify-center font-display text-7xl font-bold"
                    style={{ color: NAVY }}
                  >
                    {member.title.charAt(0).toUpperCase()}
                  </span>
                )}

                <div
                  className="absolute inset-x-0 bottom-0 h-1/2"
                  style={{
                    background: `linear-gradient(to top, ${NAVY}f2, ${NAVY}80 45%, transparent)`,
                  }}
                />

                <div className="absolute inset-x-0 bottom-0 p-5 text-center text-white">
                  <h3 className="font-display text-lg font-bold leading-tight">
                    {member.title}
                  </h3>
                  {member.subtitle && (
                    <p
                      className="mt-1 text-sm font-semibold"
                      style={{ color: PINK }}
                    >
                      {member.subtitle}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {isCarousel && (
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            aria-label="Integrante anterior"
            onClick={showPrevious}
            className="cursor-pointer rounded-full border border-white/30 p-2 text-white/80 transition hover:border-white hover:text-white"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Integrante siguiente"
            onClick={showNext}
            className="cursor-pointer rounded-full border border-white/30 p-2 text-white/80 transition hover:border-white hover:text-white"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      )}

      {spotlight && (
        <TeamMemberSpotlight
          member={spotlight.member}
          origin={spotlight.origin}
          focusOnOpen={spotlight.viaKeyboard}
          onCloseStart={handleSpotlightCloseStart}
          onClosed={handleSpotlightClosed}
        />
      )}
    </div>
  );
}
