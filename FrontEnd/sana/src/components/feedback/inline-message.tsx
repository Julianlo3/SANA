import { AlertCircle, CheckCircle2, Info } from "lucide-react";

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
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  const Icon = TONE_ICONS[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-xl p-4 text-xs leading-relaxed ${TONE_STYLES[tone]}`}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}