"use client";

import { useEffect, useRef } from "react";

/**
 * Defines backdrop accents.
 */
export const BACKDROP_ACCENTS = [
  { soft: "#fbd5e2", strong: "#eb5886" },
  { soft: "#cdeef0", strong: "#2e8c96" },
  { soft: "#d6e4f6", strong: "#134176" },
  { soft: "#feefc4", strong: "#d9a21b" },
];

/**
 * Defines module-level values for pink and teal and blue and gold.
 */
const [PINK, TEAL, BLUE, GOLD] = BACKDROP_ACCENTS;

/**
 * Defines the layer fade ms.
 */
const LAYER_FADE_MS = 700;

/**
 * Defines the blobs.
 */
const BLOBS = [
  {
    className: "-right-20 -top-24 h-80 w-80",
    drift: [40, 50],
    duration: 11000,
  },
  {
    className: "-bottom-28 -left-16 h-72 w-72",
    drift: [-50, -30],
    duration: 14000,
  },
  {
    className: "right-1/4 top-1/2 h-48 w-48",
    drift: [-60, 40],
    duration: 9000,
  },
];

/**
 * Defines the bubbles.
 */
const BUBBLES = [
  { left: "8%", size: 14, duration: 9000 },
  { left: "22%", size: 28, duration: 12000 },
  { left: "37%", size: 10, duration: 8000 },
  { left: "51%", size: 20, duration: 11000 },
  { left: "64%", size: 34, duration: 14000 },
  { left: "76%", size: 12, duration: 7500 },
  { left: "88%", size: 22, duration: 10000 },
];
/**
 * Defines the bubble travel px.
 */
const BUBBLE_TRAVEL_PX = 620;

/**
 * Defines the rings.
 */
const RINGS = 3;
/**
 * Defines the ring ms.
 */
const RING_MS = 10000;
/**
 * Defines the orbits.
 */
const ORBITS = [{ size: "38rem", duration: 70000, reverse: false }];

/**
 * Defines the sparkles.
 */
const SPARKLES = [
  { left: "12%", top: "18%", size: 6, duration: 4200 },
  { left: "26%", top: "72%", size: 4, duration: 5200 },
  { left: "38%", top: "10%", size: 5, duration: 3800 },
  { left: "8%", top: "48%", size: 4, duration: 6000 },
  { left: "58%", top: "86%", size: 6, duration: 4600 },
  { left: "70%", top: "14%", size: 4, duration: 5600 },
  { left: "86%", top: "30%", size: 7, duration: 4400 },
  { left: "92%", top: "64%", size: 4, duration: 5000 },
  { left: "78%", top: "80%", size: 5, duration: 3900 },
  { left: "20%", top: "90%", size: 5, duration: 5400 },
];

/**
 * Defines the waves.
 */
const WAVES = [
  { height: "42%", opacity: 0.35, duration: 26000 },
  { height: "32%", opacity: 0.55, duration: 18000 },
  { height: "22%", opacity: 0.8, duration: 12000 },
];
/**
 * Defines the wave path.
 */
const WAVE_PATH =
  "M0 60 Q180 0 360 60 T720 60 T1080 60 T1440 60 T1800 60 T2160 60 T2520 60 T2880 60 V120 H0 Z";

/**
 * Defines the floaters.
 */
const FLOATERS = [
  { className: "left-[10%] top-[16%] h-5 w-5 rounded-md", duration: 6000 },
  { className: "left-[82%] top-[12%] h-7 w-7 rounded-full", duration: 7400 },
  { className: "left-[70%] top-[42%] h-4 w-4 rounded-sm", duration: 5200 },
  { className: "left-[18%] top-[48%] h-6 w-6 rounded-full", duration: 8200 },
  { className: "left-[44%] top-[8%] h-3 w-3 rounded-full", duration: 4800 },
  { className: "left-[90%] top-[56%] h-5 w-5 rounded-md", duration: 6800 },
];

/**
 * Defines the layer motion type.
 */
type LayerMotion = (layer: HTMLElement) => Animation[];

/**
 * Implements the select operation.
 * @param layer layer input.
 * @param selector selector input.
 */
function select(layer: HTMLElement, selector: string) {
  return Array.from(layer.querySelectorAll(selector));
}

/**
 * Implements the bubbles motion operation.
 * @param layer layer input.
 */
const bubblesMotion: LayerMotion = (layer) => [
  ...select(layer, "[data-blob]").map((element, order) =>
    element.animate(
      [
        { transform: "translate(0, 0) scale(1)" },
        {
          transform: `translate(${BLOBS[order].drift[0]}px, ${BLOBS[order].drift[1]}px) scale(1.18)`,
        },
      ],
      {
        duration: BLOBS[order].duration,
        direction: "alternate",
        easing: "ease-in-out",
        iterations: Infinity,
      },
    ),
  ),
  ...select(layer, "[data-bubble]").map((element, order) =>
    element.animate(
      [
        { transform: "translate(0, 0)", opacity: 0 },
        { opacity: 1, offset: 0.15 },
        {
          transform: `translate(${order % 2 ? 18 : -18}px, ${-BUBBLE_TRAVEL_PX / 2}px)`,
          offset: 0.5,
        },
        { opacity: 0.8, offset: 0.85 },
        { transform: `translate(0, ${-BUBBLE_TRAVEL_PX}px)`, opacity: 0 },
      ],
      {
        duration: BUBBLES[order].duration,
        delay: -BUBBLES[order].duration * ((order * 0.37) % 1),
        easing: "linear",
        iterations: Infinity,
      },
    ),
  ),
];

/**
 * Implements the ripples motion operation.
 * @param layer layer input.
 */
const ripplesMotion: LayerMotion = (layer) => [
  ...select(layer, "[data-ring]").map((element, order) =>
    element.animate(
      [
        { transform: "scale(0.2)", opacity: 0 },
        { opacity: 0.35, offset: 0.2 },
        { transform: "scale(2.2)", opacity: 0 },
      ],
      {
        duration: RING_MS,
        delay: -(RING_MS / RINGS) * order,
        easing: "cubic-bezier(0.25, 0.5, 0.4, 1)",
        iterations: Infinity,
      },
    ),
  ),
  ...select(layer, "[data-orbit]").map((element, order) =>
    element.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      {
        duration: ORBITS[order].duration,
        direction: ORBITS[order].reverse ? "reverse" : "normal",
        easing: "linear",
        iterations: Infinity,
      },
    ),
  ),
  ...select(layer, "[data-glow]").map((element) =>
    element.animate([{ transform: "scale(1)" }, { transform: "scale(1.2)" }], {
      duration: 8000,
      direction: "alternate",
      easing: "ease-in-out",
      iterations: Infinity,
    }),
  ),
];

/**
 * Implements the waves motion operation.
 * @param layer layer input.
 */
const wavesMotion: LayerMotion = (layer) => [
  ...select(layer, "[data-wave]").map((element, order) =>
    element.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
      {
        duration: WAVES[order].duration,
        easing: "linear",
        iterations: Infinity,
      },
    ),
  ),
  ...select(layer, "[data-floater]").map((element, order) =>
    element.animate(
      [
        { transform: "translateY(0) rotate(0deg)" },
        { transform: "translateY(-26px) rotate(120deg)" },
      ],
      {
        duration: FLOATERS[order].duration,
        delay: -order * 700,
        direction: "alternate",
        easing: "ease-in-out",
        iterations: Infinity,
      },
    ),
  ),
];

/**
 * Implements the sparkles motion operation.
 * @param layer layer input.
 */
const sparklesMotion: LayerMotion = (layer) => [
  ...select(layer, "[data-sparkle]").map((element, order) =>
    element.animate(
      [
        { transform: "translateY(0) scale(0.4)", opacity: 0 },
        { transform: "translateY(-8px) scale(1)", opacity: 0.9, offset: 0.5 },
        { transform: "translateY(-16px) scale(0.4)", opacity: 0 },
      ],
      {
        duration: SPARKLES[order].duration,
        delay: -SPARKLES[order].duration * ((order * 0.41) % 1),
        easing: "ease-in-out",
        iterations: Infinity,
      },
    ),
  ),
  ...select(layer, "[data-halo]").map((element, order) =>
    element.animate(
      [
        { transform: "translate(0, 0) scale(1)" },
        { transform: `translate(${order ? -40 : 40}px, 30px) scale(1.15)` },
      ],
      {
        duration: 12000 + order * 3000,
        direction: "alternate",
        easing: "ease-in-out",
        iterations: Infinity,
      },
    ),
  ),
];

/**
 * Defines the layer motions.
 */
const LAYER_MOTIONS = [
  bubblesMotion,
  ripplesMotion,
  wavesMotion,
  sparklesMotion,
];

/**
 * Renders the service backdrop component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function ServiceBackdrop({ theme }: { theme: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerAnimations = useRef<Animation[][]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(root.children) as HTMLElement[];
    layerAnimations.current = layers.map((layer, order) =>
      LAYER_MOTIONS[order](layer),
    );
    return () => layerAnimations.current.flat().forEach((a) => a.cancel());
  }, []);

  useEffect(() => {
    layerAnimations.current[theme]?.forEach((animation) => animation.play());
    const timer = setTimeout(
      () =>
        layerAnimations.current.forEach((animations, order) => {
          if (order !== theme) animations.forEach((a) => a.pause());
        }),
      LAYER_FADE_MS,
    );
    return () => clearTimeout(timer);
  }, [theme]);

  const layerClass = (order: number) =>
    `absolute inset-0 overflow-hidden transition-[opacity,scale] ease-out ${
      order === theme ? "scale-100 opacity-100" : "scale-105 opacity-0"
    }`;
  const layerStyle = { transitionDuration: `${LAYER_FADE_MS}ms` };

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    >
      <div className={layerClass(0)} style={layerStyle}>
        {BLOBS.map((blob) => (
          <div
            key={blob.className}
            data-blob
            className={`absolute rounded-full opacity-70 blur-3xl ${blob.className}`}
            style={{ backgroundColor: PINK.soft }}
          />
        ))}
        {BUBBLES.map((bubble) => (
          <span
            key={bubble.left}
            data-bubble
            className="absolute -bottom-10 rounded-full border-2 opacity-0"
            style={{
              left: bubble.left,
              width: bubble.size,
              height: bubble.size,
              borderColor: PINK.strong,
              backgroundColor: PINK.soft,
            }}
          />
        ))}
      </div>

      <div className={layerClass(1)} style={layerStyle}>
        <div
          data-glow
          className="absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-80 blur-3xl"
          style={{ backgroundColor: TEAL.soft }}
        />
        <div
          data-glow
          className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full opacity-70 blur-3xl"
          style={{ backgroundColor: TEAL.soft }}
        />
        {Array.from({ length: RINGS }, (_, order) => (
          <span
            key={order}
            data-ring
            className="absolute left-[88%] top-[88%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: TEAL.strong }}
          />
        ))}
        {ORBITS.map((orbit) => (
          <div
            key={orbit.size}
            data-orbit
            className="absolute left-[88%] top-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
            style={{
              width: orbit.size,
              height: orbit.size,
              borderColor: `${TEAL.strong}26`,
            }}
          >
            <span
              className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: `${TEAL.strong}99` }}
            />
          </div>
        ))}
      </div>

      <div className={layerClass(2)} style={layerStyle}>
        <div
          className="absolute -right-24 -top-28 h-80 w-80 rounded-full opacity-70 blur-3xl"
          style={{ backgroundColor: BLUE.soft }}
        />
        {FLOATERS.map((floater) => (
          <span
            key={floater.className}
            data-floater
            className={`absolute border-2 ${floater.className}`}
            style={{
              borderColor: `${BLUE.strong}33`,
              backgroundColor: `${BLUE.soft}99`,
            }}
          />
        ))}
        {WAVES.map((wave) => (
          <svg
            key={wave.duration}
            data-wave
            viewBox="0 0 2880 120"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-[200%]"
            style={{ height: wave.height, opacity: wave.opacity }}
          >
            <path d={WAVE_PATH} fill={BLUE.soft} />
          </svg>
        ))}
      </div>

      <div className={layerClass(3)} style={layerStyle}>
        <div
          data-halo
          className="absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-80 blur-3xl"
          style={{ backgroundColor: GOLD.soft }}
        />
        <div
          data-halo
          className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full opacity-60 blur-3xl"
          style={{ backgroundColor: PINK.soft }}
        />
        {SPARKLES.map((sparkle) => (
          <span
            key={`${sparkle.left}-${sparkle.top}`}
            data-sparkle
            className="absolute rounded-full opacity-0"
            style={{
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
              backgroundColor: GOLD.strong,
              boxShadow: `0 0 ${sparkle.size * 3}px ${sparkle.size}px ${GOLD.soft}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
