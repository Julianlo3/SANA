"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";
import {
  buildWallRows,
  wallRatio,
  type WallItem,
} from "@/features/content/config/gallery-wall";
import type { PublicGalleryImage } from "@/features/content/types/content-types";

/**
 * Defines the drag threshold px.
 */
const DRAG_THRESHOLD_PX = 6;
/**
 * Defines the max fling px s.
 */
const MAX_FLING_PX_S = 1800;
/**
 * Defines the stop response.
 */
const STOP_RESPONSE = 4.5;
/**
 * Defines the start response.
 */
const START_RESPONSE = 1.4;
/**
 * Defines the max frame s.
 */
const MAX_FRAME_S = 0.05;

/**
 * Defines the row motion type.
 */
type RowMotion = {
  x: number;
  velocity: number;
  width: number;
  isHovered: boolean;
  isFocused: boolean;
  isDragging: boolean;
};

/**
 * Defines the drag state type.
 */
type DragState = {
  row: number;
  pointerId: number;
  startX: number;
  startOffset: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  hasMoved: boolean;
};

/**
 * Implements the wrap operation.
 * @param x x input.
 * @param width width input.
 */
function wrap(x: number, width: number) {
  if (width <= 0) return x;
  return ((x % width) - width) % width;
}

/**
 * Renders the gallery wall component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function GalleryWall({
  images,
  ratios,
  isRunning,
  isAutoplay,
  regionLabel,
  onRatio,
  onOpen,
}: Readonly<{
  images: PublicGalleryImage[];
  ratios: Record<number, number>;
  isRunning: boolean;
  isAutoplay: boolean;
  regionLabel: string;
  onRatio: (id: number, ratio: number) => void;
  onOpen: (index: number, photo: HTMLElement) => void;
}>) {
  const rows = useMemo(() => buildWallRows(images.length), [images.length]);
  const viewportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setRefs = useRef<(HTMLUListElement | null)[]>([]);
  const motion = useRef<RowMotion[]>(
    rows.map(() => ({
      x: 0,
      velocity: 0,
      width: 0,
      isHovered: false,
      isFocused: false,
      isDragging: false,
    })),
  );
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const autoplay = useRef(isAutoplay);

  const apply = (row: number) => {
    const track = trackRefs.current[row];
    if (track) track.style.transform = `translate3d(${motion.current[row].x}px, 0, 0)`;
  };

  useEffect(() => {
    autoplay.current = isAutoplay;
  }, [isAutoplay]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setRefs.current.forEach((set, row) => {
        const state = motion.current[row];
        if (!set || !state) return;
        const isFirstMeasure = state.width === 0;
        state.width = set.offsetWidth;
        if (isFirstMeasure && row === 1) state.x = -state.width / 3;
        state.x = wrap(state.x, state.width);
        apply(row);
      });
    });
    setRefs.current.forEach((set) => set && observer.observe(set));
    return () => observer.disconnect();
  }, [images.length]);

  useEffect(() => {
    if (!isRunning) return;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_FRAME_S);
      last = now;
      rows.forEach((row, index) => {
        const state = motion.current[index];
        if (!state || state.isDragging) return;
        const isHeld = state.isHovered || state.isFocused;
        const target = autoplay.current && !isHeld ? row.speed * row.direction : 0;
        const response = target === 0 ? STOP_RESPONSE : START_RESPONSE;
        state.velocity += (target - state.velocity) * (1 - Math.exp(-dt * response));
        if (Math.abs(state.velocity) < 0.05 && target === 0) {
          state.velocity = 0;
          return;
        }
        state.x = wrap(state.x + state.velocity * dt, state.width);
        apply(index);
      });
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isRunning, rows]);

  useEffect(() => {
    const cleanups = viewportRefs.current.map((viewport, row) => {
      if (!viewport) return undefined;
      const onWheel = (event: WheelEvent) => {
        const delta = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
        if (!delta || Math.abs(event.deltaX) < Math.abs(event.deltaY) && !event.shiftKey) return;
        event.preventDefault();
        const state = motion.current[row];
        state.velocity = 0;
        state.x = wrap(state.x - delta, state.width);
        apply(row);
      };
      viewport.addEventListener("wheel", onWheel, { passive: false });
      return () => viewport.removeEventListener("wheel", onWheel);
    });
    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [images.length]);

  const onPointerDown = (row: number) => (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = {
      row,
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: motion.current[row].x,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
      hasMoved: false,
    };

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      const current = drag.current;
      if (current?.pointerId !== moveEvent.pointerId) return;
      const dx = moveEvent.clientX - current.startX;
      const state = motion.current[current.row];
      if (!current.hasMoved && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      current.hasMoved = true;
      state.isDragging = true;
      const now = performance.now();
      const elapsed = Math.max(now - current.lastTime, 1) / 1000;
      current.velocity = (moveEvent.clientX - current.lastX) / elapsed;
      current.lastX = moveEvent.clientX;
      current.lastTime = now;
      state.x = wrap(current.startOffset + dx, state.width);
      apply(current.row);
    };

    const onEnd = (endEvent: globalThis.PointerEvent) => {
      const current = drag.current;
      if (current?.pointerId !== endEvent.pointerId) return;
      const state = motion.current[current.row];
      if (current.hasMoved) {
        suppressClick.current = endEvent.type === "pointerup";
        const isStale = performance.now() - current.lastTime > 80;
        state.velocity = isStale
          ? 0
          : Math.max(-MAX_FLING_PX_S, Math.min(MAX_FLING_PX_S, current.velocity));
      }
      state.isDragging = false;
      drag.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const onItemFocus = (row: number) => (event: FocusEvent<HTMLLIElement>) => {
    if (!event.target.matches(":focus-visible")) return;
    const state = motion.current[row];
    const viewport = viewportRefs.current[row];
    if (!viewport) return;
    state.isFocused = true;
    state.velocity = 0;
    const item = event.currentTarget;
    const center = item.offsetLeft + item.offsetWidth / 2;
    state.x = wrap(viewport.clientWidth / 2 - center, state.width);
    apply(row);
  };

  const renderItem = (item: WallItem, row: number, isCopy: boolean) => {
    const image = images[item.index];
    const isPrimary = item.isPrimary && !isCopy;
    const label = `Ver foto ${item.index + 1} de ${images.length}: ${image.caption ?? image.imageAlt}`;
    return (
      <li
        key={`${isCopy ? "copy" : "base"}-${item.key}`}
        aria-hidden={isPrimary ? undefined : true}
        className="gallery-polaroid"
        style={{ "--rot": `${item.rotation}deg` } as CSSProperties}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") motion.current[row].isHovered = true;
        }}
        onPointerLeave={() => {
          motion.current[row].isHovered = false;
        }}
        onFocus={isPrimary ? onItemFocus(row) : undefined}
        onBlur={() => {
          motion.current[row].isFocused = false;
        }}
      >
        <button
          type="button"
          tabIndex={isPrimary ? 0 : -1}
          data-gallery-index={isPrimary ? item.index : undefined}
          aria-label={label}
          onClick={(event) => {
            const photo = event.currentTarget.querySelector<HTMLElement>("[data-photo]");
            onOpen(item.index, photo ?? event.currentTarget);
          }}
          className="gallery-polaroid-card"
        >
          <span
            data-photo
            className="gallery-polaroid-photo"
            style={{ "--ratio": wallRatio(ratios[image.id]) } as CSSProperties}
          >
            <Image
              src={image.imageUrl}
              alt={isPrimary ? image.imageAlt : ""}
              fill
              draggable={false}
              sizes="(min-width: 1024px) 280px, (min-width: 768px) 240px, 180px"
              className="object-cover"
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (naturalWidth && naturalHeight && !ratios[image.id]) {
                  onRatio(image.id, naturalWidth / naturalHeight);
                }
              }}
            />
          </span>
        </button>
      </li>
    );
  };

  return (
    <section aria-label={regionLabel} className="gallery-wall">
      <div className="gallery-wall-tilt">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="gallery-row-shell" data-row={rowIndex}>
            <div
              ref={(element) => {
                viewportRefs.current[rowIndex] = element;
              }}
              className="gallery-row"
              onPointerDown={onPointerDown(rowIndex)}
              onClickCapture={onClickCapture}
            >
              <div
                ref={(element) => {
                  trackRefs.current[rowIndex] = element;
                }}
                className="gallery-track"
              >
                <ul
                  ref={(element) => {
                    setRefs.current[rowIndex] = element;
                  }}
                  className="gallery-set"
                >
                  {row.items.map((item) => renderItem(item, rowIndex, false))}
                </ul>
                <ul aria-hidden className="gallery-set">
                  {row.items.map((item) => renderItem(item, rowIndex, true))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
