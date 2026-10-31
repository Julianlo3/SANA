"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Clock3, Mail, Phone, Search, User } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import { formatRelativeDate } from "@/lib/format/date-time";
import { ApiError } from "@/types/api-types";
import {
  listConsultantsForAssistant,
  listConsultantsForPsychologist,
} from "../services/consultants-service";
import type { ConsultantSummary } from "../types/consultant-types";

type Props = {
  viewerRole: "assistant" | "psychologist";
};

/**
 * Displays a list of consultants based on the viewer's role.
 * @param param0 The props containing the viewer's role.
 * @returns The consultants list page.
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
      .catch((error: unknown) => {
        if (isMounted) {
          if (viewerRole === "psychologist" && error instanceof ApiError) {
            if (error.status === 404) {
              setLoadError(
                "El backend no encuentra la ruta de consultantes del psicólogo. Actualiza y reinicia el backend.",
              );
              return;
            }
            if (error.status === 403) {
              setLoadError(
                "El servidor rechazó el acceso. Verifica que la sesión tenga el rol de psicólogo.",
              );
              return;
            }
          }

          setLoadError(
            error instanceof ApiError
              ? error.message
              : "No pudimos cargar el listado. Intenta de nuevo.",
          );
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
      ? `/consultantes/${id}`
      : `/consultantes/${id}/resumen`;
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
                  {viewerRole === "psychologist" && (
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} aria-hidden />
                        {consultant.email || "Sin correo"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} aria-hidden />
                        {consultant.phone || "Sin teléfono"}
                      </span>
                    </div>
                  )}
                </div>
                {viewerRole === "psychologist" ? (
                  <div className="shrink-0 space-y-1 text-right text-xs text-text-subtle">
                    <p className="inline-flex items-center gap-1">
                      <CalendarCheck size={13} aria-hidden />
                      {consultant.appointmentCount}{" "}
                      {consultant.appointmentCount === 1 ? "cita" : "citas"}
                    </p>
                    <p className="flex items-center justify-end gap-1">
                      <Clock3 size={13} aria-hidden />
                      {consultant.completedAppointmentCount ?? 0} realizadas ·{" "}
                      {consultant.waitingAppointmentCount ?? 0} en espera
                    </p>
                  </div>
                ) : (
                  <p className="shrink-0 text-xs text-text-subtle">
                    {consultant.lastAppointmentAt
                      ? formatRelativeDate(consultant.lastAppointmentAt)
                      : "Sin citas"}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}