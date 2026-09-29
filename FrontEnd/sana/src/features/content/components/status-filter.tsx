"use client";

import type { PublicationStatus } from "../types/content-types";

export type StatusFilterValue = PublicationStatus | "all";

const OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: "published", label: "Publicadas" },
  { value: "retired", label: "Retiradas" },
  { value: "all", label: "Todas" },
];

export function matchesStatus(
  status: PublicationStatus,
  filter: StatusFilterValue,
): boolean {
  return filter === "all" || status === filter;
}

export default function StatusFilter({
  value,
  onChange,
  counts,
}: {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
  counts: Record<StatusFilterValue, number>;
}) {
  return (
    <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            value === option.value
              ? "bg-primary text-white"
              : "border border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
          }`}
        >
          {option.label} ({counts[option.value]})
        </button>
      ))}
    </div>
  );
}
