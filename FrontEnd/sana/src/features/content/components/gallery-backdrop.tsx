export default function GalleryBackdrop() {
  return (
    <div aria-hidden className="gallery-backdrop pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span className="gallery-blob gallery-blob-pink" />
      <span className="gallery-blob gallery-blob-wine" />
      <span className="gallery-blob gallery-blob-teal max-md:hidden" />
    </div>
  );
}
