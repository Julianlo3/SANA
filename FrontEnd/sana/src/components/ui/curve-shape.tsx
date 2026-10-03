type Props = {
  className?: string;
  flip?: boolean;
  style?: React.CSSProperties;
};

/** Línea curva orgánica, para decorar los bordes del hero. */
export default function CurveShape({ className, flip = false, style }: Props) {
  return (
    <svg
      viewBox="0 0 200 800"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
      className={className}
      style={{ ...style, ...(flip ? { transform: "scaleX(-1)" } : {}) }}
    >
      <path
        d="M 180 0 C 40 150, 180 300, 60 450 C -20 550, 100 650, 40 800"
        stroke="currentColor"
        strokeWidth="36"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 140 0 C 0 180, 140 320, 20 480 C -60 580, 60 680, 0 800"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}