import { Clock } from "lucide-react";

/**
 * Renders the pending content notice component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function PendingContentNotice({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p
      className={`flex items-center gap-2 rounded-2xl border border-dashed border-border bg-surface-muted px-5 py-4 text-sm text-text-subtle ${className}`}
    >
      <Clock size={16} aria-hidden className="shrink-0" />
      Información próxima a actualizarse.
    </p>
  );
}
