import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Brain,
  Feather,
  HandHeart,
  Heart,
  HeartHandshake,
  HouseHeart,
  Leaf,
  MessageCircleHeart,
  Puzzle,
  Rainbow,
  Smile,
  Sparkles,
  Sprout,
  Star,
  Sun,
} from "lucide-react";

/**
 * Defines the tile px.
 */
const TILE_PX = 440;

/**
 * Defines the watermark symbol type.
 */
type WatermarkSymbol = {
  Icon: LucideIcon;
  x: number;
  y: number;
  size: number;
  rotate: number;
};

/**
 * Defines the symbols.
 */
const SYMBOLS: WatermarkSymbol[] = [
  { Icon: Brain, x: 18, y: 22, size: 54, rotate: -12 },
  { Icon: Heart, x: 132, y: 8, size: 26, rotate: 14 },
  { Icon: Puzzle, x: 214, y: 34, size: 46, rotate: 18 },
  { Icon: Sun, x: 330, y: 16, size: 40, rotate: 0 },
  { Icon: Sparkles, x: 402, y: 92, size: 22, rotate: -8 },
  { Icon: HeartHandshake, x: 96, y: 104, size: 58, rotate: 6 },
  { Icon: Star, x: 24, y: 150, size: 20, rotate: 20 },
  { Icon: Sprout, x: 282, y: 112, size: 50, rotate: -16 },
  { Icon: Smile, x: 196, y: 168, size: 34, rotate: 10 },
  { Icon: MessageCircleHeart, x: 356, y: 178, size: 48, rotate: 12 },
  { Icon: Baby, x: 34, y: 226, size: 46, rotate: -6 },
  { Icon: Leaf, x: 150, y: 250, size: 30, rotate: -28 },
  { Icon: Rainbow, x: 236, y: 252, size: 56, rotate: 4 },
  { Icon: Heart, x: 400, y: 276, size: 24, rotate: -18 },
  { Icon: HouseHeart, x: 104, y: 320, size: 50, rotate: 8 },
  { Icon: Feather, x: 16, y: 352, size: 32, rotate: 24 },
  { Icon: HandHeart, x: 318, y: 334, size: 52, rotate: -10 },
  { Icon: Star, x: 222, y: 360, size: 26, rotate: -14 },
  { Icon: Sparkles, x: 196, y: 102, size: 18, rotate: 0 },
  { Icon: Heart, x: 286, y: 210, size: 16, rotate: 10 },
];

/**
 * Repeating pattern of the foundation's symbols, drawn as a faint watermark behind a section.
 * @param props Component properties.
 */
export default function TeamWatermark({
  id = "team-watermark",
  className = "text-white opacity-[0.08]",
}: {
  id?: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <pattern
          id={id}
          width={TILE_PX}
          height={TILE_PX}
          patternUnits="userSpaceOnUse"
        >
          {SYMBOLS.map(({ Icon, x, y, size, rotate }, order) => (
            <g
              key={order}
              transform={`translate(${x} ${y}) rotate(${rotate} ${size / 2} ${size / 2})`}
            >
              <Icon width={size} height={size} strokeWidth={1.4} />
            </g>
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
