import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

/**
 * Defines the tone type.
 */
type Tone = "info" | "error" | "success";

/**
 * Defines the tone styles.
 */
const TONE_STYLES: Record<Tone, string> = {
  info: "bg-primary-soft text-text-muted",
  error: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
};

/**
 * Defines the tone icons.
 */
const TONE_ICONS: Record<Tone, typeof Info> = {
  info: Info,
  error: AlertCircle,
  success: CheckCircle2,
};

/**
 * Renders the inline message component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function InlineMessage({
  tone = "info",
  children,
  onDismiss,
}: {
  tone?: Tone;
  children: React.ReactNode;
  /**
   * Optional handler that enables a dismiss button.
   */
  onDismiss?: () => void;
}) {
  const Icon = TONE_ICONS[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl p-4 text-xs leading-relaxed ${TONE_STYLES[tone]}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
      <p className="flex-1">{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar mensaje"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}