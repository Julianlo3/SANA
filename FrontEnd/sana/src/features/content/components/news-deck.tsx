"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NewsCard from "@/features/content/components/news-card";
import { Doodle } from "@/features/content/components/news-doodles";
import { defaultActiveIndex, SeeAllLink } from "@/features/content/components/news-shared";
import { formatDate, padNumber } from "@/features/content/format";
import { useReducedMotion } from "@/features/content/hooks/use-section-motion";
import type { NewsTeaser } from "@/features/content/types/content-types";

/**
 * Defines the fly ms.
 */
const FLY_MS = 320;
/**
 * Defines the spring ms.
 */
const SPRING_MS = 520;
/**
 * Defines the swipe ratio.
 */
const SWIPE_RATIO = 0.3;
/**
 * Defines the swipe velocity.
 */
const SWIPE_VELOCITY = 0.5;
/**
 * Defines the tap slop px.
 */
const TAP_SLOP_PX = 8;
/**
 * Defines the max drag rotation.
 */
const MAX_DRAG_ROTATION = 8;
/**
 * Defines the ease out.
 */
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
/**
 * Defines the spring.
 */
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/**
 * Defines the peek.
 */
const PEEK = [
  { x: 0, y: 0, rotate: 0 },
  { x: 12, y: 10, rotate: -3 },
  { x: -8, y: 18, rotate: 2 },
];

/**
 * Defines the tints.
 */
const TINTS = [
  "var(--color-accent-soft)",
  "var(--color-primary-soft)",
  "var(--color-highlight)",
];

/**
 * Defines the news deck labels type.
 */

export type NewsDeckLabels = {
  seeAll: string;
  featured: string;
  deck: string;
  previous: string;
  next: string;
  goTo: string;
  position: string;
};

/**
 * Defines the drag type.
 */
type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastT: number;
  velocity: number;
  dx: number;
  axis: "x" | "y" | null;
};

/**
 * Defines the pending effect type.
 */
type PendingEffect = { card: number; kind: "returned" | "entered" };

/**
 * Mobile and tablet layout: a deck of paper notes that can be swiped, with a
 * numbered index beside it on tablets.
 * @param props Component properties.
 */
export default function NewsDeck({
  news,
  labels,
}: Readonly<{
  news: NewsTeaser[];
  labels: NewsDeckLabels;
}>) {
  const count = news.length;
  const hasMany = count > 1;
  const [index, setIndex] = useState(() => defaultActiveIndex(news));
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set([defaultActiveIndex(news)]));
  const [announcement, setAnnouncement] = useState("");
  const reducedMotion = useReducedMotion();
  const dragRefs = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const isFlying = useRef(false);
  const pending = useRef<PendingEffect | null>(null);
  const flyTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(flyTimeout.current), []);

  useLayoutEffect(() => {
    const effect = pending.current;
    pending.current = null;
    const element = effect ? dragRefs.current[effect.card] : null;
    if (!effect || !element) return;

    element.getAnimations().forEach((animation) => animation.cancel());
    if (effect.kind === "returned") {
      element.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 300,
        delay: 150,
        easing: "ease-out",
        fill: "backwards",
      });
    } else {
      element.animate(
        [
          { transform: "translateX(-60%) rotate(-6deg)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 420, easing: EASE_OUT },
      );
    }
  }, [index]);

  const request = (...indexes: number[]) =>
    setLoaded((current) =>
      indexes.every((value) => current.has(value)) ? current : new Set([...current, ...indexes]),
    );

  const wrap = (value: number) => (value + count) % count;

  const show = (target: number) => {
    const next = wrap(target);
    request(next, wrap(next + 1));
    setIndex(next);
    setAnnouncement(`${labels.position} ${next + 1} de ${count}: ${news[next].title}`);
  };

  const fly = (direction: number, fromTransform = "none") => {
    const card = index;
    const element = dragRefs.current[card];
    if (!element || reducedMotion) {
      if (element) element.style.transform = "";
      show(card + 1);
      return;
    }

    isFlying.current = true;
    const distance = element.offsetWidth * 1.3 * direction;
    const animation = element.animate(
      [
        { transform: fromTransform, opacity: 1 },
        { transform: `translateX(${distance}px) rotate(${direction * 14}deg)`, opacity: 0 },
      ],
      { duration: FLY_MS, easing: "cubic-bezier(0.4, 0, 0.7, 1)", fill: "forwards" },
    );
    element.style.transform = "";

    let isDone = false;
    const finish = () => {
      if (isDone) return;
      isDone = true;
      clearTimeout(flyTimeout.current);
      isFlying.current = false;
      pending.current = { card, kind: "returned" };
      show(card + 1);
    };
    animation.onfinish = finish;
    flyTimeout.current = setTimeout(finish, FLY_MS + 100);
  };

  const springBack = (element: HTMLDivElement) => {
    const from = element.style.transform || "none";
    element.style.transform = "";
    if (from === "none") return;
    element.animate([{ transform: from }, { transform: "none" }], {
      duration: SPRING_MS,
      easing: SPRING,
    });
  };

  const goNext = () => {
    if (!isFlying.current) fly(-1);
  };

  const goPrevious = () => {
    if (isFlying.current) return;
    const target = wrap(index - 1);
    if (!reducedMotion) pending.current = { card: target, kind: "entered" };
    show(target);
  };

  const goTo = (target: number) => {
    if (target !== index && !isFlying.current) show(target);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!hasMany) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasMany || isFlying.current || event.button !== 0) return;
    request(wrap(index + 1), wrap(index - 1));
    suppressClick.current = false;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastT: event.timeStamp,
      velocity: 0,
      dx: 0,
      axis: null,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    if (!current.axis) {
      if (Math.hypot(dx, dy) < TAP_SLOP_PX) return;
      suppressClick.current = true;
      current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (current.axis === "x") event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (current.axis !== "x") return;

    const elapsed = Math.max(event.timeStamp - current.lastT, 1);
    current.velocity = (event.clientX - current.lastX) / elapsed;
    current.lastX = event.clientX;
    current.lastT = event.timeStamp;
    current.dx = dx;

    if (!reducedMotion) {
      const width = event.currentTarget.offsetWidth || 1;
      const rotation = Math.max(
        -MAX_DRAG_ROTATION,
        Math.min(MAX_DRAG_ROTATION, (dx / width) * MAX_DRAG_ROTATION * 2),
      );
      event.currentTarget.style.transform = `translateX(${dx}px) rotate(${rotation.toFixed(2)}deg)`;
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    drag.current = null;
    if (current?.axis !== "x") return;

    const element = event.currentTarget;
    const passed =
      Math.abs(current.dx) > element.offsetWidth * SWIPE_RATIO ||
      Math.abs(current.velocity) > SWIPE_VELOCITY;

    if (passed) {
      const direction = Math.sign(current.dx || current.velocity) || -1;
      fly(direction, element.style.transform || "none");
    } else {
      springBack(element);
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    springBack(event.currentTarget);
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="flex h-full flex-col md:grid md:grid-cols-2 md:gap-8">
      <section
        aria-roledescription="carrusel"
        aria-label={labels.deck}
        className="flex min-h-0 flex-1 flex-col md:h-full"
      >
        <div className="relative min-h-0 flex-1">
          {news.map((item, position) => {
            const depth = wrap(position - index);
            const peek = PEEK[Math.min(depth, PEEK.length - 1)];
            const isFront = depth === 0;
            const isPeeking = depth < PEEK.length;
            const rotate = reducedMotion ? 0 : peek.rotate;

            return (
              <div
                key={item.id}
                inert={!isFront}
                aria-hidden={!isFront}
                className="news-card-depth absolute inset-0 bottom-5 right-3"
                style={{
                  transform: `translate(${peek.x}px, ${peek.y}px) rotate(${rotate}deg)`,
                  zIndex: count - depth,
                  opacity: isPeeking ? 1 : 0,
                }}
              >
                <div
                  ref={(element) => {
                    dragRefs.current[position] = element;
                  }}
                  className="news-card-drag relative h-full"
                  onPointerDown={isFront ? handlePointerDown : undefined}
                  onPointerMove={isFront ? handlePointerMove : undefined}
                  onPointerUp={isFront ? handlePointerUp : undefined}
                  onPointerCancel={isFront ? handlePointerCancel : undefined}
                  onClickCapture={isFront ? handleClickCapture : undefined}
                >
                  <Link
                    href={`/noticias/${item.id}`}
                    draggable={false}
                    onKeyDown={handleKeyDown}
                    className="news-focus block h-full rounded-[22px]"
                  >
                    {loaded.has(position) || !item.imageUrl ? (
                      <NewsCard news={item} featuredLabel={labels.featured} variant="deck" />
                    ) : (
                      <div className="h-full rounded-[22px] bg-surface" />
                    )}
                  </Link>
                  <div
                    aria-hidden
                    className="news-card-tint pointer-events-none absolute inset-0 rounded-[22px] border border-white/70"
                    style={{
                      backgroundColor: TINTS[position % TINTS.length],
                      opacity: isFront ? 0 : 1,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {hasMany && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label={labels.previous}
              onClick={goPrevious}
              onKeyDown={handleKeyDown}
              onPointerEnter={() => request(wrap(index - 1))}
              onFocus={() => request(wrap(index - 1))}
              className="news-focus flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-wine/30 bg-white/80 text-wine transition hover:border-wine"
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-bold tabular-nums text-text">
                {index + 1} / {count}
              </span>
              <div className="flex">
                {news.map((item, position) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`${labels.goTo} ${position + 1}`}
                    aria-current={position === index ? "true" : undefined}
                    onClick={() => goTo(position)}
                    onKeyDown={handleKeyDown}
                    className="news-focus group flex h-6 w-6 cursor-pointer items-center justify-center rounded-full"
                  >
                    <span
                      className={`block h-2 w-5 rounded-full bg-wine transition-[transform,opacity] duration-300 ${
                        position === index ? "opacity-100" : "scale-x-[0.4] opacity-25 group-hover:opacity-50"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              aria-label={labels.next}
              onClick={goNext}
              onKeyDown={handleKeyDown}
              onPointerEnter={() => request(wrap(index + 1))}
              onFocus={() => request(wrap(index + 1))}
              className="news-focus flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-wine/30 bg-white/80 text-wine transition hover:border-wine"
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        )}

        <p aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </p>
      </section>

      <div className="flex h-full flex-col max-md:hidden">
        {hasMany && (
          <ol className="flex flex-col gap-1">
            {news.map((item, position) => {
              const isActive = position === index;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => goTo(position)}
                    onPointerEnter={() => request(position)}
                    className={`news-focus grid w-full cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-2 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                      isActive ? "bg-white/80 shadow-[0_10px_30px_-22px_rgba(19,65,118,0.5)]" : "hover:bg-white/50"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`font-display text-2xl font-extrabold leading-none tabular-nums ${
                        isActive ? "text-wine/50" : "text-wine/20"
                      }`}
                    >
                      {padNumber(position + 1)}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`line-clamp-2 break-words font-display text-[15px] font-bold leading-snug ${
                          isActive ? "text-wine" : "text-text"
                        }`}
                      >
                        {item.title}
                      </span>
                      <time
                        dateTime={item.publishedAt}
                        className="mt-0.5 block text-xs font-semibold text-text-muted"
                      >
                        {formatDate(item.publishedAt)}
                      </time>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        {!hasMany && (
          <div aria-hidden className="flex flex-1 items-center justify-center">
            <Doodle name="spiral" strokeWidth={1.5} className="h-20 w-20 text-primary/40" />
          </div>
        )}
        <div className="mt-auto flex justify-end pt-4">
          <SeeAllLink label={labels.seeAll} />
        </div>
      </div>

      <div className="mt-4 flex justify-center md:hidden">
        <SeeAllLink label={labels.seeAll} />
      </div>
    </div>
  );
}
