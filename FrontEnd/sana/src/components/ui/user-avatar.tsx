"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { photoCropStyle } from "@/features/content/photo-crop";
import {
  loadTeamPhotoIndex,
  normalizePersonName,
  type TeamPhoto,
} from "@/features/content/services/team-photos";
import { getInitials } from "@/lib/format/text";

/**
 * Avatar for any user: shows the photo of the "Nuestro equipo" member with the same name,
 * or `fallback` (initials by default) when there is no single match or the image fails.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function UserAvatar({
  fullName,
  className,
  sizePx = 64,
  fallback,
  shapeClassName = "rounded-full",
}: {
  fullName: string;
  className: string;
  sizePx?: number;
  fallback?: ReactNode;
  shapeClassName?: string;
}) {
  const [photo, setPhoto] = useState<TeamPhoto | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const key = normalizePersonName(fullName);

    loadTeamPhotoIndex().then((index) => {
      if (isActive) setPhoto(index.get(key) ?? null);
    });

    return () => {
      isActive = false;
    };
  }, [fullName]);

  const showPhoto = photo !== null && photo.src !== failedSrc;
  const imageWidth = photo?.crop
    ? Math.ceil((sizePx * 100) / photo.crop.width)
    : sizePx;

  return (
    <span
      aria-hidden
      className={`relative flex items-center justify-center overflow-hidden ${shapeClassName} ${className}`}
    >
      {showPhoto ? (
        <span
          className={photo.crop ? undefined : "absolute inset-0"}
          style={photo.crop ? photoCropStyle(photo.crop) : undefined}
        >
          <Image
            src={photo.src}
            alt=""
            fill
            sizes={`${imageWidth}px`}
            className="object-cover"
            onError={() => setFailedSrc(photo.src)}
          />
        </span>
      ) : (
        (fallback ?? getInitials(fullName))
      )}
    </span>
  );
}
