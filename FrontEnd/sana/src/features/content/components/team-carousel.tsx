"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CroppedPhoto from "@/features/content/components/cropped-photo";
import TeamMemberSpotlight, {
  preloadSpotlightPhoto,
} from "@/features/content/components/team-member-spotlight";
import { CARD_BANDS } from "@/features/content/config/team-card-bands";
import type {
  PublicTeamCard,
  TeamGroup,
} from "@/features/content/types/content-types";

/**
 * Defines the rotation ms.
 */
const ROTATION_MS = 3000;
/**
 * Defines the slide ms.
 */
const SLIDE_MS = 900;
/**
 * Defines the fade out ms.
 */
const FADE_OUT_MS = 400;
/**
 * Defines the fade in ms.
 */
const FADE_IN_MS = 600;
/**
 * Defines the fade in delay ms.
 */
const FADE_IN_DELAY_MS = 300;
/**
 * Defines the return fade ms.
 */
const RETURN_FADE_MS = 250;
/**
 * Defines the hover intent ms.
 */
const HOVER_INTENT_MS = 220;
/**
 * Defines the photo size px.
 */
const PHOTO_SIZE_PX = 160;

/**
 * Implements the gap for operation.
 * @param visible visible input.
 */
function gapFor(visible: number) {
  return visible <= 2 ? 16 : 24;
}

/**
 * Defines the card state type.
 */
type CardState = "open" | "returning" | "in-view" | "out-of-view";

/**
 * Implements the card transition operation.
 * @param animate animate input.
 * @param state Current status value.
 */
function cardTransition(animate: boolean, state: CardState) {
  if (!animate) return "none";
  const scale = `scale ${SLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`;
  const opacity = {
    open: "opacity 0ms",
    returning: `opacity ${RETURN_FADE_MS}ms ease-out`,
    "in-view": `opacity ${FADE_IN_MS}ms ease-out ${FADE_IN_DELAY_MS}ms`,
    "out-of-view": `opacity ${FADE_OUT_MS}ms ease-out`,
  }[state];
  return `${opacity}, ${scale}`;
}

/**
 * Defines the spotlight type.
 */
type Spotlight = {
  member: PublicTeamCard;
  origin: HTMLElement;
  viaKeyboard: boolean;
  isClosing: boolean;
};

/**
 * Implements the visible count operation.
 */
function useVisibleCount() {
  const [count, setCount] = useState(4);

  useEffect(() => {
    const queries = [
      { media: window.matchMedia("(min-width: 1280px)"), value: 5 },
      { media: window.matchMedia("(min-width: 1024px)"), value: 4 },
      { media: window.matchMedia("(min-width: 640px)"), value: 3 },
    ];
    const update = () =>
      setCount(queries.find((query) => query.media.matches)?.value ?? 2);

    update();
    queries.forEach((query) => query.media.addEventListener("change", update));
    return () =>
      queries.forEach((query) =>
        query.media.removeEventListener("change", update),
      );
  }, []);

  return count;
}

/**
 * Renders the team carousel component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function TeamCarousel({
  members,
  group,
  labelledBy,
  isPausedByOther = false,
  onProfileOpenChange,
}: {
  members: PublicTeamCard[];
  group: TeamGroup;
  labelledBy: string;
  isPausedByOther?: boolean;
  onProfileOpenChange?: (isOpen: boolean) => void;
}) {
  const band = CARD_BANDS[group];
  const visible = useVisibleCount();
  const gap = gapFor(visible);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const intentTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hoveredCard = useRef<{
    member: PublicTeamCard;
    origin: HTMLElement;
  } | null>(null);
  const lastClosedId = useRef<number | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const isCarousel = members.length > visible;
  const isPaused =
    hoveredId !== null || isFocused || spotlight !== null || isPausedByOther;
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

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

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
    member: PublicTeamCard,
    origin: HTMLElement,
    viaKeyboard = false,
  ) => {
    clearTimeout(intentTimer.current);
    setSpotlight(
      (current) => current ?? { member, origin, viaKeyboard, isClosing: false },
    );
    onProfileOpenChange?.(true);
  };

  const scheduleIntent = (member: PublicTeamCard, origin: HTMLElement) => {
    clearTimeout(intentTimer.current);
    intentTimer.current = setTimeout(
      () => openSpotlight(member, origin),
      HOVER_INTENT_MS,
    );
  };

  const handleMouseEnter = (member: PublicTeamCard, origin: HTMLElement) => {
    hoveredCard.current = { member, origin };
    if (member.imageUrl) preloadSpotlightPhoto(member.imageUrl);
    setHoveredId(member.id);
    if (member.id !== lastClosedId.current) scheduleIntent(member, origin);
  };

  const handleMouseMove = (member: PublicTeamCard, origin: HTMLElement) => {
    if (hoveredCard.current?.origin !== origin) handleMouseEnter(member, origin);
  };

  const handleMouseLeave = (member: PublicTeamCard) => {
    hoveredCard.current = null;
    if (member.id === lastClosedId.current) lastClosedId.current = null;
    setHoveredId(null);
    clearTimeout(intentTimer.current);
  };

  const isPointerOver = (element: HTMLElement) => {
    const position = pointer.current;
    if (!position) return false;
    const rect = element.getBoundingClientRect();
    return (
      position.x >= rect.left &&
      position.x <= rect.right &&
      position.y >= rect.top &&
      position.y <= rect.bottom
    );
  };

  const handleSpotlightCloseStart = () => {
    lastClosedId.current =
      spotlight && isPointerOver(spotlight.origin) ? spotlight.member.id : null;
    clearTimeout(intentTimer.current);
    setSpotlight((current) => current && { ...current, isClosing: true });
  };

  const handleSpotlightClosed = () => {
    const hovered = hoveredCard.current;
    setSpotlight(null);
    onProfileOpenChange?.(false);
    if (hovered && hovered.member.id !== lastClosedId.current) {
      scheduleIntent(hovered.member, hovered.origin);
    }
  };

  return (
    <div
      aria-roledescription="carrusel"
      aria-labelledby={labelledBy}
      className="relative mt-6"
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
            gap,
            transform: `translateX(calc(${-offset} * (100% + ${gap}px) / ${visible}))`,
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
                onMouseMove={(event) =>
                  handleMouseMove(member, event.currentTarget)
                }
                onMouseLeave={() => handleMouseLeave(member)}
                onClick={(event) => openSpotlight(member, event.currentTarget)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSpotlight(member, event.currentTarget, true);
                  }
                }}
                className={`group min-w-0 shrink-0 cursor-pointer rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-white/60 ${
                  isInView ? "scale-100" : "scale-95"
                } ${isInView && !isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
                style={{
                  flexBasis: `calc((100% - ${(visible - 1) * gap}px) / ${visible})`,
                  transition: cardTransition(animate, state),
                }}
              >
                <div className="h-full rounded-3xl bg-[linear-gradient(135deg,var(--color-support-blue),var(--color-primary),var(--color-accent),var(--color-support-pink),var(--color-support-blue))] bg-[length:300%_300%] bg-[position:0%_50%] p-[3px] shadow-lg shadow-black/25 transition-[translate,box-shadow,background-position] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2 group-hover:bg-[position:100%_50%] group-hover:shadow-2xl group-hover:shadow-black/40">
                  <div className="relative flex h-full flex-col items-center overflow-hidden rounded-[calc(1.5rem-3px)] bg-white px-3 pb-5 pt-6 text-center sm:px-4">
                    <div
                      aria-hidden
                      className={`absolute inset-x-0 top-0 h-24 [clip-path:ellipse(85%_100%_at_50%_0%)] ${band.background}`}
                    >
                      <band.LeftIcon
                        size={20}
                        className={`absolute left-4 top-3 ${band.leftIconClassName}`}
                        fill={band.fillLeftIcon ? "currentColor" : "none"}
                      />
                      <band.RightIcon
                        size={22}
                        className={`absolute right-4 top-3 transition-transform duration-700 group-hover:-rotate-12 group-hover:scale-125 ${band.rightIconClassName}`}
                      />
                    </div>

                    <div className="relative">
                      <span
                        aria-hidden
                        className={`absolute -inset-2.5 rounded-full border-2 border-dashed transition-colors duration-500 group-hover:border-accent motion-safe:group-hover:animate-[spin_12s_linear_infinite] ${band.ringClassName}`}
                      />
                      <div className="relative w-24 overflow-hidden rounded-full shadow-lg ring-4 ring-white sm:w-28 lg:w-32">
                        {member.imageUrl ? (
                          <CroppedPhoto
                            src={member.imageUrl}
                            alt={member.imageAlt ?? member.title}
                            crop={member.photoCrop}
                            size={PHOTO_SIZE_PX}
                            className="aspect-square w-full transition-transform duration-700 ease-out group-hover:scale-110"
                          />
                        ) : (
                          <span className="flex aspect-square w-full items-center justify-center bg-support-blue font-display text-4xl font-bold text-navy">
                            {member.title.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-5 line-clamp-2 font-display text-sm font-bold leading-tight text-navy sm:text-base">
                      {member.title}
                    </h3>
                    {member.subtitle && (
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-text-muted sm:text-sm">
                        {member.subtitle}
                      </p>
                    )}
                    <span
                      aria-hidden
                      className="mt-auto block h-1 w-8 translate-y-2 rounded-full bg-support-blue transition-all duration-500 group-hover:w-16 group-hover:bg-accent"
                    />
                  </div>
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
            className="cursor-pointer rounded-full border border-white/30 p-3 text-white/80 transition hover:border-white hover:text-white"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Integrante siguiente"
            onClick={showNext}
            className="cursor-pointer rounded-full border border-white/30 p-3 text-white/80 transition hover:border-white hover:text-white"
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
