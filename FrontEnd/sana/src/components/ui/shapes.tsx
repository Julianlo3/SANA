type ShapeProps = {
  className?: string;
};

export function PawPrint({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden>
      <ellipse cx="32" cy="42" rx="16" ry="13" />
      <ellipse cx="14" cy="26" rx="7" ry="9" />
      <ellipse cx="27" cy="16" rx="7" ry="9.5" />
      <ellipse cx="43" cy="17" rx="7" ry="9" />
      <ellipse cx="54" cy="29" rx="6.5" ry="8" />
    </svg>
  );
}

export function Star({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden>
      <path d="M16 0c1 9 6 14 16 16-10 2-15 7-16 16-1-9-6-14-16-16C10 14 15 9 16 0Z" />
    </svg>
  );
}

export function Cloud({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 120 60" fill="currentColor" className={className} aria-hidden>
      <path d="M30 52a18 18 0 0 1-2-35.8A24 24 0 0 1 72 10a16 16 0 0 1 22 14 15 15 0 0 1-4 28H30Z" />
    </svg>
  );
}

export function Balloon({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 48 72" className={className} aria-hidden>
      <ellipse cx="24" cy="26" rx="18" ry="24" fill="currentColor" />
      <path
        d="M24 50v6M24 56c-4 3 4 6 0 10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wave({ className }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M0 40c180-40 360-40 540-8s360 48 540 8 240-40 360-24v64H0Z" />
    </svg>
  );
}