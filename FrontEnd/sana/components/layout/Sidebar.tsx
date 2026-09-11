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

const navItems = [
  { label: "Pacientes", href: "/patients", icon: Users, enabled: false },
  { label: "Citas", href: "/appointments", icon: Calendar, enabled: false },
  { label: "Expedientes", href: "/records", icon: FolderOpen, enabled: false },
  { label: "Recepción", href: "/reception", icon: ClipboardList, enabled: false },
  { label: "Reportes", href: "/reports", icon: BarChart3, enabled: false },
  { label: "Contenido", href: "/content", icon: FileText, enabled: false },
  { label: "Solicitudes", href: "/access-requests", icon: ClipboardList, enabled: false },
  { label: "Usuarios", href: "/users", icon: UserCog, enabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar p-4">
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
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                pathname === href
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
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-background">
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
  );
}