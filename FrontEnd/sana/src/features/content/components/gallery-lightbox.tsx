"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useModalDialog } from "@/features/content/hooks/use-modal-dialog";
import type { PublicGalleryImage } from "@/features/content/types/content-types";

/**
 * Defines the swipe distance px.
 */
const SWIPE_DISTANCE_PX = 60;
/**
 * Defines the close distance px.
 */
const CLOSE_DISTANCE_PX = 110;
/**
 * Defines the tap tolerance px.
 */
const TAP_TOLERANCE_PX = 10;
/**
 * Defines the flip ms.
 */
const FLIP_MS = 520;
/**
 * Defines the flip easing.
 */
const FLIP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Defines the drag type.
 */
type Drag = { x: number; y: number; dx: number; dy: number; id: number };

/**
 * Defines the round button.
 */
const ROUND_BUTTON =
  "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

/**
 * Implements the contained rect operation.
 * @param frame frame input.
 * @param ratio ratio input.
 */
function containedRect(frame: DOMRect, ratio: number) {
  const width = Math.min(frame.width, frame.height * ratio);
  const height = width / ratio;
  return new DOMRect(
    frame.left + (frame.width - width) / 2,
    frame.top + (frame.height - height) / 2,
    width,
    height,
  );
}

/**
 * Implements the prefers reduced motion operation.
 */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Renders the gallery lightbox component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function GalleryLightbox({
  images,
  index,
  ratios,
  originRect,
  onIndexChange,
  onClose,
  label,
}: Readonly<{
  images: PublicGalleryImage[];
  index: number;
  ratios: Record<number, number>;
  originRect: DOMRect | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  label: string;
}>) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const didSwipe = useRef(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [natural, setNatural] = useState<{ id: number; ratio: number } | null>(null);
  const image = images[index];
  const hasMany = images.length > 1;
  const savedRatio = image ? ratios[image.id] : undefined;
  const ratio = image && natural?.id === image.id ? natural.ratio : savedRatio;

  const show = (next: number) =>
    onIndexChange((next + images.length) % images.length);

  useModalDialog({
    dialogRef,
    initialFocusRef: closeRef,
    onClose,
    onKeyDown: (event) => {
      if (!hasMany) return;
      if (event.key === "ArrowRight") show(index + 1);
      else if (event.key === "ArrowLeft") show(index - 1);
    },
  });

  const openingRect = useRef(originRect);
  const openingRatio = useRef(ratio);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    backdropRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      easing: "ease-out",
    });
    const frame = frameRef.current;
    const origin = openingRect.current;
    const startRatio = openingRatio.current;
    if (!frame || !origin || !startRatio) return;
    const target = containedRect(frame.getBoundingClientRect(), startRatio);
    const frameRect = frame.getBoundingClientRect();
    const originX = target.left + target.width / 2 - frameRect.left;
    const originY = target.top + target.height / 2 - frameRect.top;
    const dx = origin.left + origin.width / 2 - (target.left + target.width / 2);
    const dy = origin.top + origin.height / 2 - (target.top + target.height / 2);
    frame.animate(
      [
        {
          transformOrigin: `${originX}px ${originY}px`,
          transform: `translate(${dx}px, ${dy}px) scale(${origin.width / target.width}, ${origin.height / target.height})`,
        },
        { transformOrigin: `${originX}px ${originY}px`, transform: "none" },
      ],
      { duration: FLIP_MS, easing: FLIP_EASING },
    );
  }, []);

  if (!image) return null;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    setDrag({ x: event.clientX, y: event.clientY, dx: 0, dy: 0, id: event.pointerId });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || drag.id !== event.pointerId) return;
    setDrag({ ...drag, dx: event.clientX - drag.x, dy: event.clientY - drag.y });
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || drag.id !== event.pointerId) return;
    const { dx, dy } = drag;
    setDrag(null);
    didSwipe.current = Math.hypot(dx, dy) > TAP_TOLERANCE_PX;
    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    if (isHorizontal && hasMany && Math.abs(dx) > SWIPE_DISTANCE_PX) {
      show(dx < 0 ? index + 1 : index - 1);
    } else if (!isHorizontal && dy > CLOSE_DISTANCE_PX) {
      onClose();
    }
  };

  const onStageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    const frame = frameRef.current?.getBoundingClientRect();
    if (!frame) return;
    const photo = ratio ? containedRect(frame, ratio) : frame;
    const isInside =
      event.clientX >= photo.left &&
      event.clientX <= photo.right &&
      event.clientY >= photo.top &&
      event.clientY <= photo.bottom;
    if (!isInside) onClose();
  };

  const isHorizontalDrag = drag !== null && Math.abs(drag.dx) > Math.abs(drag.dy);
  const pullDown = drag && !isHorizontalDrag ? Math.max(drag.dy, 0) : 0;
  let dragOffset: string | undefined;
  if (drag) {
    dragOffset = isHorizontalDrag
      ? `translate3d(${drag.dx}px, 0, 0)`
      : `translate3d(0, ${pullDown}px, 0)`;
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[60] flex flex-col text-white"
      style={{ opacity: Math.max(0.35, 1 - pullDown / 400) }}
    >
      <div
        ref={backdropRef}
        aria-hidden
        className="absolute inset-0 bg-[#14060c]/85 backdrop-blur-md"
      />

      <div className="relative flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
        <p aria-live="polite" className="text-sm font-semibold tabular-nums text-white/85">
          {index + 1} / {images.length}
        </p>
        <button
          ref={closeRef}
          type="button"
          aria-label="Cerrar foto"
          onClick={onClose}
          className={ROUND_BUTTON}
        >
          <X size={22} aria-hidden />
        </button>
      </div>

      <div
        role="presentation"
        className="relative min-h-0 flex-1 touch-none select-none"
        onClick={onStageClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        <div
          className="pointer-events-none absolute inset-x-4 inset-y-2 sm:inset-x-24"
          style={{
            transform: dragOffset,
            transition: drag ? "none" : "transform 250ms ease-out",
          }}
        >
          <div ref={frameRef} className="relative h-full w-full">
            <div key={image.id} className="gallery-lightbox-photo relative h-full w-full">
              <Image
                src={image.imageUrl}
                alt={image.imageAlt}
                fill
                sizes="100vw"
                className="object-contain"
                draggable={false}
                onLoad={(event) => {
                  const { naturalWidth, naturalHeight } = event.currentTarget;
                  if (naturalWidth && naturalHeight) {
                    setNatural({ id: image.id, ratio: naturalWidth / naturalHeight });
                  }
                }}
              />
            </div>
          </div>
        </div>

        {hasMany && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => show(index - 1)}
              className={`${ROUND_BUTTON} absolute left-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 sm:flex`}
            >
              <ChevronLeft size={28} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => show(index + 1)}
              className={`${ROUND_BUTTON} absolute right-6 top-1/2 hidden h-12 w-12 -translate-y-1/2 sm:flex`}
            >
              <ChevronRight size={28} aria-hidden />
            </button>
          </>
        )}
      </div>

      <div className="relative flex shrink-0 items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:justify-center sm:px-6">
        {hasMany && (
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={() => show(index - 1)}
            className={`${ROUND_BUTTON} sm:hidden`}
          >
            <ChevronLeft size={24} aria-hidden />
          </button>
        )}
        <p className="min-h-6 flex-1 text-center text-sm leading-relaxed text-white/90 sm:max-w-2xl sm:flex-none sm:text-base">
          {image.caption ?? image.imageAlt}
        </p>
        {hasMany && (
          <button
            type="button"
            aria-label="Foto siguiente"
            onClick={() => show(index + 1)}
            className={`${ROUND_BUTTON} sm:hidden`}
          >
            <ChevronRight size={24} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
