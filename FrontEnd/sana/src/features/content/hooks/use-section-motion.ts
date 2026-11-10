"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

type Entrance = "idle" | "waiting" | "shown";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  };
}

const subscribeReducedMotion = subscribeMedia(REDUCED_MOTION_QUERY);
const subscribeDesktop = subscribeMedia(DESKTOP_QUERY);

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/** Null while hydrating, so the server markup and the first client render stay the same. */
export function useDesktop(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => null,
  );
}

export function useTabVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}

/**
 * Tracks whether a section is on screen and whether its entrance animation
 * should wait (it started off screen) or has been shown.
 */
export function useSectionEntrance(ref: RefObject<HTMLElement | null>) {
  const [isInView, setIsInView] = useState(false);
  const [entrance, setEntrance] = useState<Entrance>("idle");

  useEffect(() => {
    const section = ref.current;
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
  }, [ref]);

  return { isInView, entrance };
}
