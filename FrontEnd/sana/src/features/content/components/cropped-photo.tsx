import Image from "next/image";
import { photoCropStyle } from "../photo-crop";
import type { PhotoCrop } from "../types/content-types";

type Props = {
  src: string;
  alt: string;
  crop: PhotoCrop | null;
  /** Rendered diameter in CSS pixels, used to request an image large enough for the crop. */
  size: number;
  className?: string;
  /** Border radius utility; circular unless another shape is requested. */
  shapeClassName?: string;
};

/**
 * Photo that shows only the saved crop of the original image; without a crop it centers the image.
 */
export default function CroppedPhoto({
  src,
  alt,
  crop,
  size,
  className = "",
  shapeClassName = "rounded-full",
}: Props) {
  const imageWidth = crop ? Math.ceil((size * 100) / crop.width) : size;

  return (
    <div className={`relative overflow-hidden bg-surface-muted ${shapeClassName} ${className}`}>
      {crop ? (
        <div style={photoCropStyle(crop)}>
          <Image src={src} alt={alt} fill sizes={`${imageWidth}px`} className="object-cover" />
        </div>
      ) : (
        <Image src={src} alt={alt} fill sizes={`${imageWidth}px`} className="object-cover" />
      )}
    </div>
  );
}
