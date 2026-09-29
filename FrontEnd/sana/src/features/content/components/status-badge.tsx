import type { PublicationStatus } from "../types/content-types";

export default function StatusBadge({ status }: { status: PublicationStatus }) {
  return status === "published" ? (
    <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
      Publicada
    </span>
  ) : (
    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-text-subtle">
      Retirada
    </span>
  );
}
