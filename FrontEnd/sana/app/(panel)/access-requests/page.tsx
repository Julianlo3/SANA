"use client";

import { useState } from "react";
import { Mail, BadgeCheck, SlidersHorizontal } from "lucide-react";
import PageDecor from "@/components/ui/PageDecor";
import {
  mockAccessRequests,
  type AccessRequest,
} from "@/lib/mocks/access-requests";
import RequestActionDialog, {
  type RequestAction,
} from "@/components/access-requests/RequestActionDialog";

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>(mockAccessRequests);
  const [dialog, setDialog] = useState<{
    action: RequestAction;
    request: AccessRequest;
  } | null>(null);

  function handleConfirm(
    action: RequestAction,
    request: AccessRequest,
    value?: string,
  ) {
    setRequests((current) => current.filter((item) => item.id !== request.id));
    console.log(action, request.fullName, value);
    setDialog(null);
  }

  return (
    <>
      <PageDecor variant="requests" />

       <div className="relative z-10 mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-primary-dark">
              Solicitudes de Acceso
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text-muted">
              Gestiona el acceso de nuevos usuarios a la plataforma de la
              Fundación Dejando Huellas Felices.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="flex items-center gap-2 rounded-full bg-surface-muted px-4 py-2 text-sm text-text-muted">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {requests.length} pendientes
            </span>
            <button className="cursor-pointer rounded-full bg-surface-muted p-2.5 text-text-muted transition hover:text-text">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {requests.map((request) => (
            <article
              key={request.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
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
                    <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-success">
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
                <button
                  onClick={() => setDialog({ action: "reject", request })}
                  className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition hover:border-text-muted hover:text-text"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => setDialog({ action: "approve", request })}
                  className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  Aprobar
                </button>
              </div>
            </article>
          ))}
        </div>

        {requests.length === 0 && (
          <div className="mt-8 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
            <p className="font-display text-xl font-bold text-text">
              No hay solicitudes pendientes
            </p>
            <p className="mt-2 text-sm text-text-subtle">
              Las nuevas solicitudes de acceso aparecerán aquí para su revisión.
            </p>
          </div>
        )}

        {dialog && (
          <RequestActionDialog
            action={dialog.action}
            request={dialog.request}
            onConfirm={handleConfirm}
            onClose={() => setDialog(null)}
          />
        )}
      </div>
    </>
  );
}