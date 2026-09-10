"use client";

import { useState } from "react";
import { Mail, BadgeCheck, SlidersHorizontal } from "lucide-react";
import { solicitudesDemo, type Solicitud } from "@/lib/datos-demo";

export default function SolicitudesPage() {
  const [solicitudes] = useState<Solicitud[]>(solicitudesDemo);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl text-texto">
            Solicitudes de Acceso
          </h1>
          <p className="mt-2 max-w-xl text-sm text-texto-suave">
            Gestiona el acceso de nuevos usuarios a la plataforma de la
            Fundación Dejando Huellas Felices.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-superficie px-4 py-2 text-sm text-texto-suave">
            <span className="h-2 w-2 rounded-full bg-lavanda" />
            {solicitudes.length} pendientes
          </span>
          <button className="cursor-pointer rounded-full bg-superficie p-2.5 text-texto-suave hover:text-texto">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {solicitudes.map((s) => (
          <article
            key={s.id}
            className="flex items-center gap-4 rounded-2xl bg-superficie p-5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primario-oscuro text-sm font-semibold text-white">
              {s.nombre
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-texto">
                {s.nombre}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-texto-tenue">
                <span className="flex items-center gap-1.5">
                  <Mail size={13} />
                  {s.correo}
                </span>
                {s.correoVerificado && (
                  <span className="flex items-center gap-1.5 text-lavanda">
                    <BadgeCheck size={13} />
                    Correo verificado
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-texto-tenue">
                Solicitado el {s.fecha}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button className="cursor-pointer rounded-lg border border-borde px-4 py-2 text-sm text-texto-suave transition hover:border-texto-suave hover:text-texto">
                Rechazar
              </button>
              <button className="cursor-pointer rounded-lg bg-lavanda px-4 py-2 text-sm font-semibold text-fondo transition hover:brightness-110">
                Aprobar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}