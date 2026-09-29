export default function IconButton({
  label,
  onClick,
  disabled,
  isActive = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive || undefined}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-lg border p-2 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 ${
        isActive ? "border-primary bg-primary-soft text-primary" : "border-border text-text-muted"
      }`}
    >
      {children}
    </button>
  );
}
