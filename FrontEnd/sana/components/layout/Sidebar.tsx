"use client";

import { useState } from "react";
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
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { label: "Pacientes", href: "/patients", icon: Users, enabled: false },
  { label: "Citas", href: "/appointments", icon: Calendar, enabled: false },
  { label: "Expedientes", href: "/records", icon: FolderOpen, enabled: false },
  { label: "Recepción", href: "/reception", icon: ClipboardList, enabled: false },
  { label: "Reportes", href: "/reports", icon: BarChart3, enabled: false },
  { label: "Contenido", href: "/content", icon: FileText, enabled: false },
  { label: "Usuarios", href: "/users", icon: UserCog, enabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="fixed left-4 top-4 z-30 cursor-pointer rounded-xl border border-border bg-surface p-2.5 text-text-muted shadow-sm lg:hidden"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-sidebar p-4 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <span className="font-display text-lg font-bold text-white">S</span>
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-text">SANA</p>
            <p className="text-[10px] tracking-widest text-text-subtle">
              DEJANDO HUELLAS
            </p>
          </div>

          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="ml-auto cursor-pointer text-text-subtle lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {navItems.map(({ label, href, icon: Icon, enabled }) => {
            if (!enabled) {
              return (
                <span
                  key={href}
                  title="Disponible en un próximo sprint"
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-text-subtle/40"
                >
                  <Icon size={20} />
                  <span className="text-sm">{label}</span>
                </span>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  pathname.startsWith(href)
                    ? "bg-accent font-semibold text-white"
                    : "text-text-muted hover:bg-primary-soft"
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-xl bg-surface p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
            AS
          </div>
          <div className="flex-1 leading-tight">
            <p className="text-sm font-semibold text-text">Alejandro Silva</p>
            <p className="text-xs text-text-subtle">Administrador</p>
          </div>
          <button className="cursor-pointer text-text-subtle hover:text-text">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}