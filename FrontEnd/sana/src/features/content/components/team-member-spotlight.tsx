"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import type { PublicContentCard } from "@/features/content/types/content-types";

const OPEN_MS = 700;
const CLOSE_MS = 350;
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const ORIGIN_RADIUS = 16;
const PANEL_RADIUS = 28;
const VIEWPORT_MARGIN = 16;

const NAVY = "#134176";
const NAVY_SOFT = "#b5d4f4";
const PINK = "#eb5886";

const FULL_CLIP = `inset(0px 0px 0px 0px round ${PANEL_RADIUS}px)`;

const FULL_FRAME = { transform: "translate(0px, 0px)", clipPath: FULL_CLIP };

function originFrame(origin: HTMLElement, panel: HTMLElement) {
  const from = origin.getBoundingClientRect();
  const to = new DOMRect(
    panel.offsetLeft,
    panel.offsetTop,
    panel.offsetWidth,
    panel.offsetHeight,
  );
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const insetY = Math.max((to.height - from.height) / 2, 0);
  const insetX = Math.max((to.width - from.width) / 2, 0);

  return {
    transform: `translate(${dx}px, ${dy}px)`,
    clipPath: `inset(${insetY}px ${insetX}px ${insetY}px ${insetX}px round ${ORIGIN_RADIUS}px)`,
  };
}

function isInside(rect: DOMRect, x: number, y: number) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function TeamMemberSpotlight({
  member,
  origin,
  focusOnOpen,
  onCloseStart,
  onClosed,
}: {
  member: PublicContentCard;
  origin: HTMLElement;
  focusOnOpen: boolean;
  onCloseStart: () => void;
  onClosed: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);
  const hasEnteredRef = useRef(false);
  const isOpenRef = useRef(false);

  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!backdrop || !panel) return;

    const from = origin.getBoundingClientRect();
    const { width, height } = panel.getBoundingClientRect();
    panel.style.left = `${(document.documentElement.clientWidth - width) / 2}px`;
    panel.style.top = `${clamp(
      from.top + from.height / 2 - height / 2,
      VIEWPORT_MARGIN,
      window.innerHeight - height - VIEWPORT_MARGIN,
    )}px`;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = reduceMotion ? 0 : OPEN_MS;

    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: duration * 0.6,
      easing: "ease-out",
      fill: "both",
    });
    const grow = panel.animate(
      [
        { ...originFrame(origin, panel), opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { ...FULL_FRAME, opacity: 1 },
      ],
      { duration, easing: EASE_OUT, fill: "both" },
    );
    grow.onfinish = () => {
      isOpenRef.current = true;
    };
    panel
      .querySelector("[data-photo]")
      ?.animate([{ transform: "scale(1.15)" }, { transform: "scale(1)" }], {
        duration: duration * 1.4,
        easing: EASE_OUT,
        fill: "both",
      });
    panel.querySelectorAll("[data-reveal]").forEach((element, order) =>
      element.animate(
        [
          { opacity: 0, transform: "translateY(16px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: duration * 0.8,
          delay: reduceMotion ? 0 : 200 + order * 70,
          easing: EASE_OUT,
          fill: "both",
        },
      ),
    );

    if (focusOnOpen) panel.focus({ preventScroll: true });
  }, [origin, focusOnOpen]);

  const close = useCallback(() => {
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (isClosingRef.current || !backdrop || !panel) return;
    isClosingRef.current = true;
    if (panel.parentElement) panel.parentElement.style.pointerEvents = "none";
    onCloseStart();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = reduceMotion ? 0 : CLOSE_MS;

    [panel, backdrop].forEach((element) =>
      element.getAnimations().forEach((animation) => {
        animation.commitStyles();
        animation.cancel();
      }),
    );

    backdrop.animate([{ opacity: 0 }], {
      duration,
      easing: EASE_IN_OUT,
      fill: "forwards",
    });
    const fadeOut = panel.animate(
      [{ opacity: 0, transform: "translate(0px, 12px) scale(0.96)" }],
      { duration, easing: EASE_IN_OUT, fill: "forwards" },
    );

    fadeOut.onfinish = () => {
      if (focusOnOpen) origin.focus({ preventScroll: true });
      onClosed();
    };
  }, [origin, focusOnOpen, onCloseStart, onClosed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, [close]);

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div
        ref={backdropRef}
        aria-hidden
        onClick={close}
        onMouseMove={(event) => {
          const panel = panelRef.current;
          if (hasEnteredRef.current || !panel) return;
          const from = origin.getBoundingClientRect();
          const to = panel.getBoundingClientRect();
          const path = new DOMRect(
            Math.min(from.left, to.left),
            Math.min(from.top, to.top),
            Math.max(from.right, to.right) - Math.min(from.left, to.left),
            Math.max(from.bottom, to.bottom) - Math.min(from.top, to.top),
          );
          if (!isInside(path, event.clientX, event.clientY)) close();
        }}
        className="absolute inset-0 backdrop-blur-md"
        style={{ backgroundColor: `${NAVY}66` }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`team-member-${member.id}`}
        tabIndex={-1}
        onMouseMove={() => {
          if (isOpenRef.current) hasEnteredRef.current = true;
        }}
        onMouseLeave={() => {
          if (isOpenRef.current) close();
        }}
        className="fixed flex h-[min(34rem,calc(100dvh-2rem))] w-[min(58rem,calc(100vw-2rem))] flex-col overflow-hidden bg-white shadow-2xl outline-none sm:flex-row"
        style={{ clipPath: FULL_CLIP }}
      >
        <div
          className="relative h-1/2 shrink-0 overflow-hidden sm:h-full sm:w-[45%]"
          style={{ backgroundColor: NAVY }}
        >
          {member.imageUrl ? (
            <>
              <Image
                src={member.imageUrl}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 640px) 100vw, 420px"
                className="scale-125 object-cover opacity-60 blur-2xl"
              />
              <div data-photo className="absolute inset-0">
                <Image
                  src={member.imageUrl}
                  alt={member.imageAlt ?? member.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 420px"
                  className="object-contain"
                />
              </div>
            </>
          ) : (
            <span
              data-photo
              className="absolute inset-0 flex items-center justify-center font-display text-9xl font-bold"
              style={{ backgroundColor: NAVY_SOFT, color: NAVY }}
            >
              {member.title.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-7 py-8 sm:px-12 sm:py-12">
          <div className="my-auto">
            <p
              data-reveal
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: PINK }}
            >
              {member.subtitle}
            </p>
            <h3
              data-reveal
              id={`team-member-${member.id}`}
              className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl"
              style={{ color: NAVY }}
            >
              {member.title}
            </h3>
            <span
              data-reveal
              aria-hidden
              className="mt-5 block h-1 w-14 rounded-full"
              style={{ backgroundColor: PINK }}
            />
            {member.description && (
              <p
                data-reveal
                className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-text-muted"
              >
                {member.description}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label="Cerrar"
          onClick={close}
          className="absolute right-4 top-4 cursor-pointer rounded-full bg-white/90 p-2 text-text-muted shadow-sm transition hover:text-text"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}
