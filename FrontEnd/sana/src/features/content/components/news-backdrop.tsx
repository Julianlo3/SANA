import type { CSSProperties } from "react";
import { Doodle, type DoodleName } from "@/features/content/components/news-doodles";

/**
 * Defines the floaters.
 */
const FLOATERS: {
  name: DoodleName;
  className: string;
  duration: number;
  delay: number;
}[] = [
  { name: "star", className: "left-[4%] top-[14%] h-10 w-10 text-[#d9a21b]", duration: 26, delay: 0 },
  { name: "heart", className: "right-[6%] top-[10%] h-9 w-9 text-accent", duration: 30, delay: -8 },
  { name: "spiral", className: "left-[44%] top-[4%] h-11 w-11 text-primary max-md:hidden", duration: 34, delay: -4 },
  { name: "cloud", className: "bottom-[8%] left-[8%] h-12 w-12 text-primary-dark", duration: 38, delay: -14 },
  { name: "sun", className: "bottom-[12%] right-[38%] h-10 w-10 text-[#d9a21b] max-lg:hidden", duration: 32, delay: -20 },
  { name: "squiggle", className: "bottom-[4%] right-[5%] h-10 w-14 text-accent", duration: 28, delay: -11 },
];

/**
 * Renders the news backdrop component.
 * @returns Rendered component.
 */
export default function NewsBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span className="news-blob news-blob-sky" />
      <span className="news-blob news-blob-sun" />
      {FLOATERS.map((floater) => (
        <span
          key={floater.name}
          className={`news-float absolute opacity-30 ${floater.className}`}
          style={
            {
              "--float-duration": `${floater.duration}s`,
              "--float-delay": `${floater.delay}s`,
            } as CSSProperties
          }
        >
          <Doodle name={floater.name} strokeWidth={1.6} className="h-full w-full" />
        </span>
      ))}
    </div>
  );
}
