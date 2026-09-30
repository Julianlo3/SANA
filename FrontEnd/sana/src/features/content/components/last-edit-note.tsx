import { History } from "lucide-react";
import { formatDateTime } from "../format";

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
      Última edición: {name} · {formatDateTime(updatedAt)}
    </p>
  );
}
