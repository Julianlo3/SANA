"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Images, Pause, Play } from "lucide-react";
import GalleryAllPhotos from "@/features/content/components/gallery-all-photos";
import GalleryBackdrop from "@/features/content/components/gallery-backdrop";
import GalleryLightbox from "@/features/content/components/gallery-lightbox";
import GalleryWall from "@/features/content/components/gallery-wall";
import type { PublicGalleryImage } from "@/features/content/types/content-types";
import "../styles/gallery.css";

const LETTER_DELAY_MS = 55;

export type GalleryLabels = {
  title: string;
  wall: string;
  dialog: string;
  allPhotos: string;
  showAll: string;
  pause: string;
  resume: string;
};

type Entrance = "idle" | "waiting" | "shown";

type LightboxState = {
  index: number;
  originRect: DOMRect | null;
  returnFocus: HTMLElement;
};

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

export default function GallerySection({
  images,
  labels,
  emptyState,
}: {
  images: PublicGalleryImage[];
  labels: GalleryLabels;
  emptyState: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const showAllRef = useRef<HTMLButtonElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [entrance, setEntrance] = useState<Entrance>("idle");
  const [pausedByUser, setPausedByUser] = useState<boolean | null>(null);
  const [ratios, setRatios] = useState<Record<number, number>>({});
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const isTabVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );

  const isPaused = pausedByUser ?? reducedMotion;
  const isRunning = isInView && isTabVisible && lightbox === null && !isGridOpen;
  const isMoving = isRunning && !isPaused;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          setEntrance("shown");
        } else if (!entry.isIntersecting) {
          setEntrance((current) => (current === "idle" ? "waiting" : current));
        }
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const recordRatio = (id: number, ratio: number) =>
    setRatios((current) => (current[id] ? current : { ...current, [id]: ratio }));

  const openPhoto = (index: number, trigger: HTMLElement, fromWall: boolean) => {
    const canonical = fromWall
      ? sectionRef.current?.querySelector<HTMLElement>(`[data-gallery-index="${index}"]`)
      : null;
    setLightbox({
      index,
      originRect: trigger.getBoundingClientRect(),
      returnFocus: canonical ?? trigger.closest("button") ?? trigger,
    });
  };

  const closeLightbox = () => {
    lightbox?.returnFocus.focus({ preventScroll: true });
    setLightbox(null);
  };

  const closeGrid = () => {
    setIsGridOpen(false);
    showAllRef.current?.focus({ preventScroll: true });
  };

  const title = Array.from(labels.title);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      aria-labelledby="gallery-title"
      data-entrance={entrance}
      data-motion={isMoving ? "on" : "off"}
      className="gallery-section relative isolate overflow-x-clip bg-[#fbeaf0] py-16 md:py-20"
    >
      <GalleryBackdrop />

      <div className="relative mx-auto max-w-6xl px-6">
        <h2
          id="gallery-title"
          aria-label={labels.title}
          className="font-display text-4xl font-extrabold text-[#993556]"
        >
          {title.map((letter, position) => (
            <span
              key={position}
              aria-hidden
              className="gallery-title-letter"
              style={{ "--letter-delay": `${position * LETTER_DELAY_MS}ms` } as CSSProperties}
            >
              {letter}
            </span>
          ))}
        </h2>
      </div>

      {images.length > 0 ? (
        <>
          <GalleryWall
            images={images}
            ratios={ratios}
            isRunning={isRunning}
            isAutoplay={!isPaused}
            regionLabel={labels.wall}
            onRatio={recordRatio}
            onOpen={(index, photo) => openPhoto(index, photo, true)}
          />

          <div className="relative mx-auto flex max-w-6xl items-center justify-center gap-3 px-6">
            <button
              ref={showAllRef}
              type="button"
              onClick={() => setIsGridOpen(true)}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[#993556] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-md transition hover:scale-105 hover:bg-[#7f2a47] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#993556]/30"
            >
              <Images size={18} aria-hidden />
              {labels.showAll}
            </button>
            <button
              type="button"
              aria-label={isPaused ? labels.resume : labels.pause}
              title={isPaused ? labels.resume : labels.pause}
              onClick={() => setPausedByUser(!isPaused)}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-[#993556]/40 bg-white/70 text-[#993556] transition hover:border-[#993556] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#993556]/30"
            >
              {isPaused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
            </button>
          </div>
        </>
      ) : (
        <div className="relative mx-auto max-w-6xl px-6">{emptyState}</div>
      )}

      {isGridOpen &&
        createPortal(
          <GalleryAllPhotos
            images={images}
            title={labels.allPhotos}
            isActive={lightbox === null}
            onOpenPhoto={(index, trigger) => {
              const photo = trigger.querySelector<HTMLElement>("[data-photo]");
              openPhoto(index, photo ?? trigger, false);
            }}
            onClose={closeGrid}
          />,
          document.body,
        )}

      {lightbox &&
        createPortal(
          <GalleryLightbox
            images={images}
            index={lightbox.index}
            ratios={ratios}
            originRect={lightbox.originRect}
            onIndexChange={(index) =>
              setLightbox((current) => (current ? { ...current, index } : current))
            }
            onClose={closeLightbox}
            label={labels.dialog}
          />,
          document.body,
        )}
    </section>
  );
}
