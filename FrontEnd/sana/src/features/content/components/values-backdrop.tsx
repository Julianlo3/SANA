import type { CSSProperties } from "react";
import { Doodle, type DoodleName } from "@/features/content/components/news-doodles";
import "../styles/values.css";

const NAMES: DoodleName[] = ["star", "heart", "spiral", "cloud", "sun", "squiggle"];

const COLORS = [
  "text-[#d9a21b]",
  "text-accent",
  "text-primary",
  "text-primary-dark",
  "text-accent-strong",
  "text-support-blue",
];

const COLUMNS = 7;
const ROWS = 6;
const COUNT = 40;

// Fixed-seed generator so server and client render the same positions.
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = createRandom(20251113);

const between = (min: number, max: number) => min + random() * (max - min);

const SYMBOLS = Array.from({ length: COUNT }, (_, index) => {
  const column = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  const size = Math.round(between(22, 40));

  return {
    name: NAMES[index % NAMES.length],
    color: COLORS[index % COLORS.length],
    hideOnMobile: index % 2 === 1,
    style: {
      left: `${((column + between(0.1, 0.75)) / COLUMNS) * 100}%`,
      top: `${((row + between(0.1, 0.75)) / ROWS) * 100}%`,
      width: `${size}px`,
      height: `${size}px`,
      opacity: between(0.14, 0.22).toFixed(2),
      "--float-rotate": `${Math.round(between(-30, 30))}deg`,
      "--float-duration": `${between(14, 26).toFixed(1)}s`,
      "--float-delay": `${(-between(0, 26)).toFixed(1)}s`,
    } as CSSProperties,
  };
});

export default function ValuesBackdrop() {
  return (
    <div aria-hidden className="values-backdrop pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-linear-to-b from-surface-muted via-accent-soft/40 to-surface-muted" />
      {SYMBOLS.map((symbol, index) => (
        <span
          key={index}
          className={`values-float absolute ${symbol.color} ${symbol.hideOnMobile ? "max-md:hidden" : ""}`}
          style={symbol.style}
        >
          <Doodle name={symbol.name} strokeWidth={1.6} className="h-full w-full" />
        </span>
      ))}
    </div>
  );
}
