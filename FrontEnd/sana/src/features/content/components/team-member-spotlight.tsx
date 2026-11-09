"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image, { getImageProps } from "next/image";
import { Quote, X } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
} from "@/features/content/components/social-icons";
import TeamWatermark from "@/features/content/components/team-watermark";
import { CARD_BANDS } from "@/features/content/config/team-card-bands";
import { photoFocusPosition } from "@/features/content/photo-crop";
import type { PublicTeamCard } from "@/features/content/types/content-types";

const OPEN_MS = 700;
const CLOSE_MS = 350;
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const ORIGIN_RADIUS = 24;
const PANEL_RADIUS = 28;
const VIEWPORT_MARGIN = 16;
const PHOTO_SIZES = "(max-width: 640px) 100vw, 720px";

const preloadedPhotos = new Set<string>();

/**
 * Downloads and decodes the profile photo ahead of time so opening the profile does not stall on it.
 * @param src The photo URL.
 */
export function preloadSpotlightPhoto(src: string) {
  if (preloadedPhotos.has(src)) return;
  preloadedPhotos.add(src);
  const { props } = getImageProps({ src, alt: "", fill: true, sizes: PHOTO_SIZES });
  const image = new window.Image();
  if (props.sizes) image.sizes = props.sizes;
  if (props.srcSet) image.srcset = props.srcSet;
  image.src = props.src;
  image.decode().catch(() => preloadedPhotos.delete(src));
}

function socialLinks(member: PublicTeamCard) {
  return [
    { url: member.facebookUrl, network: "Facebook", Icon: FacebookIcon },
    { url: member.instagramUrl, network: "Instagram", Icon: InstagramIcon },
    { url: member.linkedinUrl, network: "LinkedIn", Icon: LinkedinIcon },
  ].filter((link): link is typeof link & { url: string } => Boolean(link.url));
}

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
  member: PublicTeamCard;
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
    const openedWidth = window.innerWidth;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onResize = () => {
      if (window.innerWidth !== openedWidth) close();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", onResize);
    };
  }, [close]);

  const links = socialLinks(member);
  const band = CARD_BANDS[member.teamGroup];

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
        className="absolute inset-0 bg-navy/50 backdrop-blur-sm will-change-[opacity]"
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
        className="fixed h-[min(40rem,calc(100dvh-2rem))] w-[min(58rem,calc(100vw-2rem))] bg-[linear-gradient(135deg,var(--color-support-blue),var(--color-primary),var(--color-accent),var(--color-support-pink))] p-[3px] shadow-2xl outline-none sm:h-[min(34rem,calc(100dvh-2rem))]"
        style={{ clipPath: FULL_CLIP }}
      >
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[25px] bg-white sm:flex-row">
          <div className="relative h-[42%] shrink-0 overflow-hidden bg-surface-muted sm:h-full sm:w-[45%]">
            {member.imageUrl ? (
              <div data-photo className="absolute inset-0">
                <Image
                  src={member.imageUrl}
                  alt={member.imageAlt ?? member.title}
                  fill
                  sizes={PHOTO_SIZES}
                  loading="eager"
                  className="object-cover"
                  style={{ objectPosition: photoFocusPosition(member.photoCrop) }}
                />
              </div>
            ) : (
              <span
                data-photo
                className="absolute inset-0 flex items-center justify-center bg-support-blue font-display text-9xl font-bold text-navy"
              >
                {member.title.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <TeamWatermark
              id={`spotlight-watermark-${member.id}`}
              className="text-navy opacity-[0.045]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-32 -top-32 h-80 w-80"
              style={{
                background: `radial-gradient(circle, ${band.glowColor} 0%, transparent 65%)`,
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-36 -left-28 h-72 w-72 bg-[radial-gradient(circle,var(--color-accent-soft)_0%,transparent_65%)]"
            />

            <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 py-6 sm:px-12 sm:py-10">
              <div className="my-auto text-center">
                {member.subtitle && (
                  <p data-reveal className="flex justify-center">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-navy shadow-sm ${band.background}`}
                    >
                      <band.RightIcon size={15} aria-hidden />
                      {member.subtitle}
                    </span>
                  </p>
                )}
                <h3
                  data-reveal
                  id={`team-member-${member.id}`}
                  className="mt-4 font-display text-2xl font-extrabold leading-tight text-navy sm:text-4xl"
                >
                  {member.title}
                </h3>
                <div
                  data-reveal
                  aria-hidden
                  className="mt-4 flex items-center justify-center gap-3"
                >
                  <span className="h-0.5 w-14 rounded-full bg-gradient-to-r from-transparent to-primary" />
                  <band.LeftIcon
                    size={18}
                    className="text-accent"
                    fill={band.fillLeftIcon ? "currentColor" : "none"}
                  />
                  <span className="h-0.5 w-14 rounded-full bg-gradient-to-l from-transparent to-primary" />
                </div>
                {member.description && (
                  <div
                    data-reveal
                    className="relative mt-7 rounded-2xl border border-border bg-white/90 px-5 pb-5 pt-6 shadow-sm"
                  >
                    <span
                      aria-hidden
                      className="absolute -top-4 left-5 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md"
                    >
                      <Quote size={14} fill="currentColor" />
                    </span>
                    <p
                      lang="es"
                      className="whitespace-pre-line text-justify text-[15px] leading-relaxed text-text-muted hyphens-auto"
                    >
                      {member.description}
                    </p>
                  </div>
                )}
                {links.length > 0 && (
                  <div data-reveal className="mt-7">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-subtle">
                      Redes sociales
                    </p>
                    <ul className="mt-3 flex flex-wrap justify-center gap-4">
                      {links.map(({ url, network, Icon }) => (
                        <li key={network}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${network} de ${member.title} (se abre en una pestaña nueva)`}
                            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-white text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-navy hover:bg-navy hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/30"
                          >
                            <Icon size={24} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label="Cerrar perfil"
          onClick={close}
          className="absolute right-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/90 text-navy shadow-md transition hover:bg-white sm:right-4 sm:top-4"
        >
          <X size={20} aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}
