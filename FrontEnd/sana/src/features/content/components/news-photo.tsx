import Image from "next/image";

/**
 * Shows the whole news picture without cropping it. The empty space around it
 * is filled with the same picture, enlarged and blurred.
 */
export default function NewsPhoto({
  src,
  alt,
  sizes,
  priority = false,
  zoom = false,
}: Readonly<{
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  zoom?: boolean;
}>) {
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        draggable={false}
        sizes={sizes}
        priority={priority}
        className="scale-125 object-cover opacity-80 blur-xl"
      />
      <Image
        src={src}
        alt={alt}
        fill
        draggable={false}
        sizes={sizes}
        priority={priority}
        className={`object-contain ${zoom ? "news-zoom" : ""}`}
      />
    </>
  );
}
