"use client";

import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Defines the rotation ms.
 */
const ROTATION_MS = 5000;
const SWIPE_MIN_PX = 40;

/**
 * Defines the hero slide type.
 */

export type HeroSlide = {
  key: string;
  src: string;
  alt: string;
};

/**
 * Renders the hero carousel component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function HeroCarousel({
  slides,
  children,
}: {
  slides: HeroSlide[];
  children?: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const hasMany = slides.length > 1;

  useEffect(() => {
    if (!hasMany || isPaused) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = setTimeout(
      () => setIndex((current) => (current + 1) % slides.length),
      ROTATION_MS,
    );
    return () => clearTimeout(timer);
  }, [index, slides.length, hasMany, isPaused]);

  const show = (next: number) =>
    setIndex((next + slides.length) % slides.length);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  // A swipe counts only when it is mostly horizontal and passes the threshold.
  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!hasMany || !start) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) <= SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;

    show(dx < 0 ? index + 1 : index - 1);
  }

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Presentación y campañas"
      className="relative flex min-h-[100vw] w-full overflow-hidden bg-navy sm:h-[85vh] sm:min-h-[600px]"
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, position) => (
        <div
          key={slide.key}
          aria-hidden={position !== index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            position === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={position === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      {children}

      {/* Invisible edge tap zones; the arrow shows only on keyboard focus. */}
      {hasMany && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={() => show(index - 1)}
            className="group absolute inset-y-0 left-0 z-10 flex w-[15%] cursor-pointer items-center justify-start pl-2 text-white outline-none sm:w-[12%] sm:pl-6"
          >
            <ChevronLeft
              className="h-8 w-8 opacity-0 drop-shadow group-focus-visible:opacity-100 sm:h-10 sm:w-10"
              strokeWidth={1.5}
              aria-hidden
            />
          </button>
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={() => show(index + 1)}
            className="group absolute inset-y-0 right-0 z-10 flex w-[15%] cursor-pointer items-center justify-end pr-2 text-white outline-none sm:w-[12%] sm:pr-6"
          >
            <ChevronRight
              className="h-8 w-8 opacity-0 drop-shadow group-focus-visible:opacity-100 sm:h-10 sm:w-10"
              strokeWidth={1.5}
              aria-hidden
            />
          </button>
        </>
      )}
    </section>
  );
}
