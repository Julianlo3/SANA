"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicBanner } from "../types/content-types";

const ROTATION_MS = 6000;

export default function BannerCarousel({ banners }: { banners: PublicBanner[] }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const hasMany = banners.length > 1;

  useEffect(() => {
    if (!hasMany || isPaused) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = setInterval(
      () => setIndex((current) => (current + 1) % banners.length),
      ROTATION_MS,
    );
    return () => clearInterval(timer);
  }, [banners.length, hasMany, isPaused]);

  if (banners.length === 0) return null;

  const show = (next: number) =>
    setIndex((next + banners.length) % banners.length);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Campañas y convocatorias"
      className="relative mx-auto max-w-6xl px-6 pb-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="relative aspect-[16/5] overflow-hidden rounded-3xl bg-surface-muted">
        {banners.map((banner, position) => (
          <div
            key={banner.id}
            aria-hidden={position !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              position === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={banner.imageUrl}
              alt={banner.imageAlt}
              fill
              priority={position === 0}
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
            />
          </div>
        ))}

        {hasMany && (
          <>
            <button
              type="button"
              aria-label="Banner anterior"
              onClick={() => show(index - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-surface/80 p-2 text-text shadow transition hover:bg-surface"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Banner siguiente"
              onClick={() => show(index + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-surface/80 p-2 text-text shadow transition hover:bg-surface"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {hasMany && (
        <div className="mt-3 flex justify-center gap-2">
          {banners.map((banner, position) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Ver banner ${position + 1} de ${banners.length}`}
              aria-current={position === index}
              onClick={() => show(position)}
              className={`h-2.5 cursor-pointer rounded-full transition-all ${
                position === index ? "w-6 bg-primary" : "w-2.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
