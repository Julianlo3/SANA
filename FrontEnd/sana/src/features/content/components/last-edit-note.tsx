import { History } from "lucide-react";
import { formatDateTime } from "../format";

/**
 * Renders the last edit note component.
 * @param props Component properties.
 * @returns Rendered component.
 */
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
