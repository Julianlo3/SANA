"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, User } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import { formatRelativeDate } from "@/lib/format/date-time";
import {
  listConsultantsForAssistant,
  listConsultantsForPsychologist,
} from "../services/consultants-service";
import type { ConsultantSummary } from "../types/consultant-types";

type Props = {
  viewerRole: "assistant" | "psychologist";
};

/**
 * Listado de consultantes (HU-2.4). El enlace de cada fila lleva a la
 * ficha completa cuando quien mira es el psicólogo tratante, o a la ficha
 * resumida cuando es la asistente — la separación real de datos la hace
 * el backend en cada endpoint, esto solo decide a qué ruta navegar.
 */
export default function ConsultantsListPage({ viewerRole }: Props) {
  const [consultants, setConsultants] = useState<ConsultantSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    const request =
      viewerRole === "psychologist"
        ? listConsultantsForPsychologist()
        : listConsultantsForAssistant();

    request
      .then((result) => {
        if (isMounted) setConsultants(result);
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("No pudimos cargar el listado. Intenta de nuevo.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [viewerRole]);

  const filteredConsultants = consultants.filter((consultant) =>
    consultant.fullName.toLowerCase().includes(query.toLowerCase()),
  );

  function detailHref(id: number): string {
    return viewerRole === "psychologist"
      ? `/consultants/${id}`
      : `/consultants/${id}/summary`;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-primary-dark">
        Consultantes
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        {viewerRole === "psychologist"
          ? "Personas asignadas a tu cuidado."
          : "Listado administrativo, sin información clínica."}
      </p>

      <div className="relative mt-6 max-w-sm">
        <Search
          size={16}
          aria-hidden
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre"
          className="w-full rounded-full border border-border bg-surface py-2.5 pl-11 pr-4 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {isLoading && (
        <p className="mt-8 text-sm text-text-subtle">Cargando…</p>
      )}

      {loadError && (
        <div className="mt-8">
          <InlineMessage tone="error">{loadError}</InlineMessage>
        </div>
      )}

      {!isLoading && !loadError && (
        <div className="mt-6 space-y-2">
          {filteredConsultants.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
              No hay consultantes que coincidan con la búsqueda.
            </p>
          ) : (
            filteredConsultants.map((consultant) => (
              <Link
                key={consultant.id}
                href={detailHref(consultant.id)}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-primary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <User size={18} aria-hidden />
                </span>
                  <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text">
                    {consultant.fullName}
                  </p>
                  <p className="text-xs text-text-subtle">
                    {viewerRole === "psychologist"
                      ? `Documento ${consultant.identityDocument}`
                      : (consultant.assignedPsychologistName ?? "Sin asignar")}
                  </p>
                </div>|
                <p className="shrink-0 text-xs text-text-subtle">
                  {consultant.lastAppointmentAt
                    ? formatRelativeDate(consultant.lastAppointmentAt)
                    : "Sin citas"}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}