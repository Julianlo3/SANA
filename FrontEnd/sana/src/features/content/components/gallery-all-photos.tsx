"use client";

import { useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useModalDialog } from "@/features/content/hooks/use-modal-dialog";
import type { PublicGalleryImage } from "@/features/content/types/content-types";

/**
 * Renders the gallery all photos component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function GalleryAllPhotos({
  images,
  title,
  isActive,
  onOpenPhoto,
  onClose,
}: Readonly<{
  images: PublicGalleryImage[];
  title: string;
  isActive: boolean;
  onOpenPhoto: (index: number, trigger: HTMLElement) => void;
  onClose: () => void;
}>) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useModalDialog({ dialogRef, initialFocusRef: closeRef, isActive, onClose });

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-all-title"
      className="gallery-overlay fixed inset-0 z-50 flex flex-col bg-[#fbeaf0]"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#993556]/10 px-4 py-3 sm:px-8 sm:py-4">
        <h2
          id="gallery-all-title"
          className="font-display text-2xl font-extrabold text-[#993556] sm:text-3xl"
        >
          {title}
          <span className="ml-2 text-base font-semibold text-text-muted">
            ({images.length})
          </span>
        </h2>
        <button
          ref={closeRef}
          type="button"
          aria-label="Cerrar todas las fotos"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-[#993556] shadow-sm transition hover:bg-[#993556] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#993556]/30"
        >
          <X size={22} aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul className="gallery-overlay-grid mx-auto grid max-w-6xl grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-5 sm:p-8 lg:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={(event) => onOpenPhoto(index, event.currentTarget)}
                aria-label={`Ver foto ${index + 1} de ${images.length}: ${image.caption ?? image.imageAlt}`}
                className="group block w-full cursor-zoom-in bg-white p-1.5 pb-5 shadow-[0_8px_20px_-10px_rgba(153,53,86,0.45)] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#993556]/40 sm:p-2 sm:pb-7"
              >
                <span data-photo className="relative block aspect-square overflow-hidden bg-[#fbeaf0]">
                  <Image
                    src={image.imageUrl}
                    alt={image.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
