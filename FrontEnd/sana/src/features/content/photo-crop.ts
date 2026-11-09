import type { CSSProperties } from "react";
import type { PhotoCrop } from "./types/content-types";

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Normalizes a crop to two decimals and keeps it inside the original image.
 * @param crop The crop as percentages of the original image.
 * @returns The crop the backend accepts.
 */
export function normalizePhotoCrop(crop: PhotoCrop): PhotoCrop {
  const width = Math.min(100, Math.max(0.01, round(crop.width)));
  const height = Math.min(100, Math.max(0.01, round(crop.height)));
  return {
    x: Math.min(100 - width, Math.max(0, round(crop.x))),
    y: Math.min(100 - height, Math.max(0, round(crop.y))),
    width,
    height,
  };
}

/**
 * Builds the largest centered square crop for an image of the given size.
 * @param naturalWidth The image width in pixels.
 * @param naturalHeight The image height in pixels.
 * @returns The centered crop as percentages of the original image.
 */
export function centeredSquareCrop(naturalWidth: number, naturalHeight: number): PhotoCrop {
  if (naturalWidth >= naturalHeight) {
    const width = (naturalHeight / naturalWidth) * 100;
    return normalizePhotoCrop({ x: (100 - width) / 2, y: 0, width, height: 100 });
  }
  const height = (naturalWidth / naturalHeight) * 100;
  return normalizePhotoCrop({ x: 0, y: (100 - height) / 2, width: 100, height });
}

/**
 * Loads an image only to read its natural size.
 * @param src The image URL.
 * @returns A promise with the natural width and height.
 */
export function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("image_load_failed"));
    image.src = src;
  });
}

/**
 * Builds an object-position that keeps the center of the saved crop in view when the image covers a box.
 * @param crop The crop as percentages of the original image, or null to favor the upper part of a portrait.
 * @returns A CSS object-position value.
 */
export function photoFocusPosition(crop: PhotoCrop | null): string {
  if (!crop) return "50% 30%";
  return `${round(crop.x + crop.width / 2)}% ${round(crop.y + crop.height / 2)}%`;
}

/**
 * Positions the full image inside a square box so only the cropped area is visible.
 * @param crop The crop as percentages of the original image.
 * @returns Styles for an absolutely positioned wrapper of the full image.
 */
export function photoCropStyle(crop: PhotoCrop): CSSProperties {
  return {
    position: "absolute",
    width: `${10000 / crop.width}%`,
    height: `${10000 / crop.height}%`,
    left: `${(-crop.x * 100) / crop.width}%`,
    top: `${(-crop.y * 100) / crop.height}%`,
  };
}
