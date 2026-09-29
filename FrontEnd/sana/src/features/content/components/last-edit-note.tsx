import { History } from "lucide-react";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function LastEditNote({
  name,
  updatedAt,
}: {
  name: string;
  updatedAt: string;
}) {
  return (
    <p className="flex items-center gap-2 text-xs text-text-subtle">
      <History size={14} aria-hidden />
      Última edición: {name} · {DATE_FORMATTER.format(new Date(updatedAt))}
    </p>
  );
}
