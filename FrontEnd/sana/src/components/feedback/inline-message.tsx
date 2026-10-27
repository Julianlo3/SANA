import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type Tone = "info" | "error" | "success";

const TONE_STYLES: Record<Tone, string> = {
  info: "bg-primary-soft text-text-muted",
  error: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
};

const TONE_ICONS: Record<Tone, typeof Info> = {
  info: Info,
  error: AlertCircle,
  success: CheckCircle2,
};

export default function InlineMessage({
  tone = "info",
  children,
  onDismiss,
}: {
  tone?: Tone;
  children: React.ReactNode;
  /** Si se pasa, muestra un botón × para descartar el mensaje. */
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