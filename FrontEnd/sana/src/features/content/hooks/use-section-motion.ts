"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

/**
 * Defines the entrance type.
 */
type Entrance = "idle" | "waiting" | "shown";

/**
 * Defines the reduced motion query.
 */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/**
 * Defines the desktop query.
 */
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Implements the subscribe media operation.
 * @param query Operation parameters.
 */
function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  };
}

/**
 * Defines the subscribe reduced motion.
 */
const subscribeReducedMotion = subscribeMedia(REDUCED_MOTION_QUERY);
/**
 * Defines the subscribe desktop.
 */
const subscribeDesktop = subscribeMedia(DESKTOP_QUERY);

/**
 * Implements the subscribe visibility operation.
 * @param onChange on change input.
 */
function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/**
 * Provides state and actions for reduced motion.
 * @returns Feature state, data, and action handlers.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

/**
 * Null while hydrating, so the server markup and the first client render stay the same.
 * @returns Result of the operation.
 */
export function useDesktop(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => null,
  );
}

/**
 * Provides state and actions for tab visible.
 * @returns Feature state, data, and action handlers.
 */
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
 * @param ref ref input.
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
