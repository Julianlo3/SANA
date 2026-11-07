"use client";

/**
 * Visual variants supported by the shared button component.
 */
type Variant = "primary" | "secondary" | "danger";

/**
 * Tailwind classes mapped to each button variant.
 */
const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-background hover:brightness-110 disabled:bg-text-subtle disabled:hover:brightness-100",
  secondary:
    "border border-border text-text-muted hover:border-text-muted hover:text-text",
  danger: "bg-red-600 text-white hover:bg-red-500",
};

/**
 * Props supported by the shared button component.
 */
type Props = {
  /** Native button type. */
  type?: "button" | "submit" | "reset";
  /** Visual style variant. */
  variant?: Variant;
  /** Optional click handler. */
  onClick?: () => void;
  /** Disables the button when true. */
  disabled?: boolean;
  /** Button contents. */
  children: React.ReactNode;
};

/**
 * Renders a styled button with native form behavior.
 * @param props Button type, style, state, handler, and contents.
 * @returns The shared button element.
 */
export default function Button({
  type,
  variant = "primary",
  onClick,
  disabled,
  children,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}