/**
 * Defines min items per set.
 */
export const MIN_ITEMS_PER_SET = 12;
/**
 * Defines the split threshold.
 */
const SPLIT_THRESHOLD = 6;
/**
 * Defines the min ratio.
 */
const MIN_RATIO = 0.72;
/**
 * Defines the max ratio.
 */
const MAX_RATIO = 1.45;
/**
 * Defines the default ratio.
 */
const DEFAULT_RATIO = 1;

/**
 * Defines the wall item type.
 */

export type WallItem = {
  key: string;
  index: number;
  rotation: number;
  isPrimary: boolean;
};

/**
 * Defines the wall row type.
 */

export type WallRow = {
  items: WallItem[];
  direction: 1 | -1;
  speed: number;
};

/**
 * Implements the rotation for operation.
 * @param seed seed input.
 */
function rotationFor(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return Math.round(((value - Math.floor(value)) * 8 - 4) * 10) / 10;
}

/**
 * Builds row.
 * @param indexes indexes input.
 * @param rowNumber row number input.
 * @param isMirror is mirror input.
 * @returns Result of the operation.
 */
function buildRow(
  indexes: number[],
  rowNumber: number,
  isMirror: boolean,
): WallItem[] {
  const repeats = Math.max(1, Math.ceil(MIN_ITEMS_PER_SET / indexes.length));
  return Array.from({ length: repeats }, (_, pass) => pass)
    .flatMap((pass) => indexes.map((index) => ({ index, pass })))
    .map(({ index, pass }, position) => ({
      key: `${rowNumber}-${position}`,
      index,
      rotation: rotationFor(rowNumber * 997 + position + 1),
      isPrimary: !isMirror && pass === 0,
    }));
}

/**
 * Splits the photos between two rows. With few photos both rows show the whole
 * set (the second one offset and hidden from assistive tech) so the strip never
 * looks empty; each row is then repeated until it is wide enough to loop.
 * @param count count input.
 * @returns Result of the operation.
 */
export function buildWallRows(count: number): WallRow[] {
  const all = Array.from({ length: count }, (_, index) => index);
  if (count < SPLIT_THRESHOLD) {
    const shift = Math.ceil(count / 2);
    const shifted = [...all.slice(shift), ...all.slice(0, shift)];
    return [
      { items: buildRow(all, 0, false), direction: -1, speed: 34 },
      { items: buildRow(shifted, 1, true), direction: 1, speed: 27 },
    ];
  }
  return [
    {
      items: buildRow(all.filter((index) => index % 2 === 0), 0, false),
      direction: -1,
      speed: 34,
    },
    {
      items: buildRow(all.filter((index) => index % 2 === 1), 1, false),
      direction: 1,
      speed: 27,
    },
  ];
}

/**
 * Implements the wall ratio operation.
 * @param ratio ratio input.
 */

export function wallRatio(ratio: number | undefined) {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio ?? DEFAULT_RATIO));
}
