"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  FolderOpen,
  ClipboardList,
  BarChart3,
  FileText,
  UserCog,
  LogOut,
} from "lucide-react";

const enlaces = [
  { nombre: "Pacientes", href: "/pacientes", icono: Users, activo: false },
  { nombre: "Citas", href: "/citas", icono: Calendar, activo: false },
  { nombre: "Expedientes", href: "/expedientes", icono: FolderOpen, activo: false },
  { nombre: "Recepción", href: "/recepcion", icono: ClipboardList, activo: false },
  { nombre: "Reportes", href: "/reportes", icono: BarChart3, activo: false },
  { nombre: "Contenido", href: "/contenido", icono: FileText, activo: false },
  { nombre: "Usuarios", href: "/usuarios", icono: UserCog, activo: true },
];

export default function Sidebar() {
  const ruta = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-aside p-4">
      <div className="flex items-center gap-3 px-2 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primario">
          <span className="font-display text-lg font-bold text-white">S</span>
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-texto">SANA</p>
          <p className="text-[10px] tracking-widest text-texto-tenue">
            DEJANDO HUELLAS
          </p>
        </div>
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {enlaces.map(({ nombre, href, icono: Icono, activo }) => {
          const seleccionado = ruta === href;

          if (!activo) {
            return (
              <span
                key={href}
                title="Disponible en un próximo sprint"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-texto-tenue/40"
              >
                <Icono size={20} />
                <span className="text-sm">{nombre}</span>
              </span>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                seleccionado
                  ? "bg-primario-oscuro font-medium text-white"
                  : "text-texto-suave hover:bg-superficie"
              }`}
            >
              <Icono size={20} />
              {nombre}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-xl bg-superficie p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lavanda text-sm font-semibold text-fondo">
          AS
        </div>
        <div className="flex-1 leading-tight">
          <p className="text-sm font-semibold text-texto">Alejandro Silva</p>
          <p className="text-xs text-texto-tenue">Administrador</p>
        </div>
        <button className="cursor-pointer text-texto-tenue hover:text-texto">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}