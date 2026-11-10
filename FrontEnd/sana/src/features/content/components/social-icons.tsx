type IconProps = { size?: number };

export function FacebookIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 21.5v-7.6h2.6l.4-3.1h-3V8.9c0-.9.3-1.5 1.5-1.5h1.6V4.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H7.8v3.1h2.6v7.6h3.1z" />
    </svg>
  );
}

export function InstagramIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function LinkedinIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5.5" cy="5.5" r="2" />
      <rect x="3.75" y="9" width="3.5" height="11.5" rx="0.5" />
      <path d="M10 9h3.3v1.6c.6-1 1.9-1.9 3.8-1.9 3.1 0 4.4 2 4.4 5.4v6.4h-3.5v-5.8c0-1.6-.5-2.7-2-2.7s-2.5 1.1-2.5 2.8v5.7H10V9z" />
    </svg>
  );
}
