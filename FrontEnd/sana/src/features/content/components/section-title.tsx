import type { CSSProperties } from "react";
import "../styles/section-title.css";

/**
 * Defines the letter delay ms.
 */
const LETTER_DELAY_MS = 55;

/**
 * Section heading whose letters rise in one by one. The animation waits while
 * an ancestor has `data-entrance="waiting"`.
 * @param props Component properties.
 */
export default function SectionTitle({
  id,
  text,
  className = "",
}: Readonly<{
  id: string;
  text: string;
  className?: string;
}>) {
  return (
    <h2
      id={id}
      aria-label={text}
      className={`font-display text-4xl font-extrabold text-wine ${className}`}
    >
      {Array.from(text).map((letter, position) => (
        <span
          key={position}
          aria-hidden
          className="section-title-letter"
          style={{ "--letter-delay": `${position * LETTER_DELAY_MS}ms` } as CSSProperties}
        >
          {letter}
        </span>
      ))}
    </h2>
  );
}
