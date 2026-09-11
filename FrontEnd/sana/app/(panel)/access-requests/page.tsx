"use client";

import { useState } from "react";
import { Mail, BadgeCheck, SlidersHorizontal } from "lucide-react";
import { mockAccessRequests, type AccessRequest } from "@/lib/mocks/access-requests";
export default function AccessRequestsPage() {
  const [requests] = useState<AccessRequest[]>(mockAccessRequests);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl text-text">
            Solicitudes de Acceso
          </h1>
          <p className="mt-2 max-w-xl text-sm text-text-muted">
            Gestiona el acceso de nuevos usuarios a la plataforma de la
            Fundación Dejando Huellas Felices.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" />
            {requests.length} pendientes
          </span>
          <button className="cursor-pointer rounded-full bg-surface p-2.5 text-text-muted hover:text-text">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {requests.map((request) => (
          <article
            key={request.id}
            className="flex items-center gap-4 rounded-2xl bg-surface p-5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-dark text-sm font-semibold text-white">
              {request.fullName
                .split(" ")
                .slice(0, 2)
                .map((word) => word[0])
                .join("")}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-text">
                {request.fullName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-subtle">
                <span className="flex items-center gap-1.5">
                  <Mail size={13} />
                  {request.email}
                </span>
                {request.emailVerified && (
                  <span className="flex items-center gap-1.5 text-accent">
                    <BadgeCheck size={13} />
                    Correo verificado
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-subtle">
                Solicitado el {request.requestedAt}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition hover:border-text-muted hover:text-text">
                Rechazar
              </button>
              <button className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition hover:brightness-110">
                Aprobar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}