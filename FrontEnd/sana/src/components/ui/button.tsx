"use client";

type Variant = "primary" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-background hover:brightness-110",
  secondary:
    "border border-border text-text-muted hover:border-text-muted hover:text-text",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

type Props = {
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

export default function Button({
  variant = "primary",
  onClick,
  disabled,
  children,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}