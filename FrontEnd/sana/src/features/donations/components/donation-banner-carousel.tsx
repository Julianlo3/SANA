'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PublicBanner } from '@/features/content/types/content-types';

interface DonationBannerCarouselProps {
  banners: PublicBanner[];
}

const DEFAULT_BANNER = {
  id: 0,
  imageUrl: '/images/ninos-arbol.jpg',
  imageAlt: 'Niñas y niños de la fundación compartiendo',
  order: 0,
};

const ROTATION_INTERVAL = 5000;

/**
 * Component that displays the dynamic banners in the donation page,
 * rotating automatically and synchronized with the content management role.
 * @param banners Array of PublicBanner
 * @returns JSX.Element
 */
export default function DonationBannerCarousel({
  banners,
}: DonationBannerCarouselProps) {
  const slides = banners.length > 0 ? banners : [DEFAULT_BANNER];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const hasMultiple = slides.length > 1;

  useEffect(() => {
    if (!hasMultiple || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(timer);
  }, [hasMultiple, isPaused, slides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      className="group relative aspect-[16/10] overflow-hidden rounded-3xl shadow-md border border-[var(--color-border)] bg-[var(--color-primary-dark)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides con transición de opacidad */}
      {slides.map((slide, index) => (
        <div
          key={slide.id || index}
          aria-hidden={index !== currentIndex}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Image
            src={slide.imageUrl}
            alt={slide.imageAlt || 'Banner de la fundación'}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
        </div>
      ))}

      {/* Gradiente y texto institucional */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-4 left-6 right-6 text-white pointer-events-none z-10">
        <p className="font-display font-bold text-lg sm:text-xl drop-shadow-sm">
          Fundación Dejando Huellas Felices
        </p>
        <p className="text-xs text-white/90 drop-shadow-sm mt-0.5 max-w-md">
          {slides[currentIndex]?.imageAlt ||
            'Trabajando día a día por un presente y futuro digno para la infancia.'}
        </p>
      </div>

      {/* Controles de navegación (si hay más de 1 banner) */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100 hover:bg-black/70 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Siguiente banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100 hover:bg-black/70 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicadores de puntos (dots) */}
          <div className="absolute bottom-3 right-6 z-20 flex gap-1.5">
            {slides.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                onClick={() => setCurrentIndex(dotIndex)}
                aria-label={`Ir al banner ${dotIndex + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  dotIndex === currentIndex
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
