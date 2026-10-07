"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ROTATION_MS = 5000;

export type HeroSlide = {
  key: string;
  src: string;
  alt: string;
};

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

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Presentación y campañas"
      className="relative h-[85vh] min-h-[600px] w-full overflow-hidden bg-primary-dark"
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
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

      {hasMany && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={() => show(index - 1)}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer p-2 text-gray-300/70 drop-shadow transition hover:text-gray-100 sm:left-6"
          >
            <ChevronLeft size={40} strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={() => show(index + 1)}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer p-2 text-gray-300/70 drop-shadow transition hover:text-gray-100 sm:right-6"
          >
            <ChevronRight size={40} strokeWidth={1.5} aria-hidden />
          </button>
        </>
      )}
    </section>
  );
}
