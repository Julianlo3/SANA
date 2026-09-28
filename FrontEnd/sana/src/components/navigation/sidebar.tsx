"use client";

import { useState } from "react";
import Image from "next/image";
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
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { getInitials } from "@/lib/format/text";
import { formatRoleLabels, findRoleByName } from "@/config/roles";

type NavLink = {
  label: string;
  href: string;
  icon: typeof Users;
  enabled: boolean;
};

/** Qué enlaces ve cada rol dentro de su propio grupo del menú. */
const LINKS_BY_ROLE: Record<string, NavLink[]> = {
  administrador: [
    { label: "Usuarios", href: "/usuarios", icon: UserCog, enabled: true },
  ],
  psicologo: [
    { label: "Consultantes", href: "/consultantes", icon: Users, enabled: true },
    {
      label: "Registrar atención",
      href: "/registro-atencion/nuevo",
      icon: ClipboardCheck,
      enabled: true,
    },
  ],
  secretario: [
    { label: "Consultantes", href: "/consultantes", icon: Users, enabled: true },
  ],
};

/** Enlaces sin rol propio todavía: se agrupan aparte, visibles siempre. */
const UPCOMING_LINKS: NavLink[] = [
  { label: "Citas", href: "/citas", icon: Calendar, enabled: false },
  { label: "Expedientes", href: "/expedientes", icon: FolderOpen, enabled: false },
  { label: "Recepción", href: "/recepcion", icon: ClipboardList, enabled: false },
  { label: "Reportes", href: "/reportes", icon: BarChart3, enabled: false },
  { label: "Contenido", href: "/contenido", icon: FileText, enabled: false },
];

type Props = {
  roles: string[];
  fullName: string;
};

export default function Sidebar({ roles, fullName }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /** El grupo de rol abierto en el acordeón. Si solo hay uno, empieza abierto. */
  const rolesWithLinks = roles.filter((role) => LINKS_BY_ROLE[role]);
  const [openGroup, setOpenGroup] = useState<string | null>(
    rolesWithLinks.length === 1 ? rolesWithLinks[0] : null,
  );

  function toggleGroup(role: string) {
    setOpenGroup((current) => (current === role ? null : role));
  }

  function renderLink(link: NavLink) {
    const Icon = link.icon;

    if (!link.enabled) {
      return (
        <span
          key={link.href}
          title="Disponible en un próximo sprint"
          className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-2.5 text-text-subtle/40"
        >
          <Icon size={18} />
          <span className="text-sm">{link.label}</span>
        </span>
      );
    }

    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
          pathname.startsWith(link.href)
            ? "bg-primary font-semibold text-white"
            : "text-text-muted hover:bg-primary-soft"
        }`}
      >
        <Icon size={18} />
        {link.label}
      </Link>
    );
  }

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
          <Image
            src="/brand/isotipo.png"
            alt=""
            width={44}
            height={44}
            className="h-10 w-10 object-contain"
          />

          <div className="leading-tight">
            <p className="font-semibold text-text">Fundación</p>
            <p className="text-[10px] tracking-widest text-text-subtle">
              DEJANDO HUELLAS FELICES
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

        <nav className="mt-6 flex flex-col gap-1 overflow-y-auto">
          {rolesWithLinks.length === 1 ? (
            // Un solo rol con acceso: sin acordeón, opciones directas.
            <div className="flex flex-col gap-1">
              {LINKS_BY_ROLE[rolesWithLinks[0]].map(renderLink)}
            </div>
          ) : (
            // Varios roles: cada uno es un grupo plegable, uno abierto a la vez.
            rolesWithLinks.map((role) => {
              const roleDefinition = findRoleByName(role);
              const isOpen = openGroup === role;

              return (
                <div key={role}>
                  <button
                    onClick={() => toggleGroup(role)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-text-subtle transition hover:bg-primary-soft"
                  >
                    {roleDefinition?.label ?? role}
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="ml-2 flex flex-col gap-1 border-l border-border pl-2">
                      {LINKS_BY_ROLE[role].map(renderLink)}
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="mt-2 border-t border-border pt-2">
            <p className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-text-subtle/60">
              Próximamente
            </p>
            {UPCOMING_LINKS.map(renderLink)}
          </div>
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-xl bg-surface p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {getInitials(fullName)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-text">
              {fullName}
            </p>
            <p className="truncate text-xs text-text-subtle">
              {formatRoleLabels(roles)}
            </p>
          </div>
          <button className="cursor-pointer text-text-subtle hover:text-text">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}