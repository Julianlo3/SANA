"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { PUBLIC_NAV } from "@/content/navigation";
import { getInitials } from "@/lib/format/text";

/**
 * Public header component for the public website (no authentication required).
 * @returns The public header.
 */
export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !accountMenuRef.current?.contains(event.target)
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  return (
    <header
      className="sticky top-0 z-30"
      style={{ backgroundColor: "#eb5886" }}
    >
      <div className="flex items-center gap-4 px-6 py-3 lg:px-12">
        <Link href="/" className="flex items-center">
          <Image
            src={PUBLIC_NAV.logo.src}
            alt={PUBLIC_NAV.logo.alt}
            width={400}
            height={92}
            priority
            className="h-11 w-auto brightness-0 invert"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-8 md:flex">
          {PUBLIC_NAV.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-bold uppercase tracking-wider text-white transition hover:text-white/80"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          {user ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                aria-label="Abrir menú de cuenta"
                aria-haspopup="true"
                aria-controls="public-account-menu"
                aria-expanded={isAccountMenuOpen}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-sm font-semibold text-white shadow-sm transition hover:ring-2 hover:ring-white/40"
              >
                {getInitials(user.name ?? user.email ?? "Usuario")}
              </button>

              {isAccountMenuOpen && (
                <nav
                  id="public-account-menu"
                  aria-label="Opciones de cuenta"
                  className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 text-text shadow-lg"
                >
                  <Link
                    href="/panel"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium transition hover:bg-surface-muted"
                  >
                    Mi espacio
                  </Link>
                  <a
                    href="/auth/logout"
                    className="flex items-center gap-2 border-t border-border px-4 py-3 text-sm font-medium transition hover:bg-surface-muted"
                  >
                    <LogOut size={16} aria-hidden />
                    Cerrar sesión
                  </a>
                </nav>
              )}
            </div>
          ) : (
            <Link
              href={PUBLIC_NAV.loginHref}
              className="cursor-pointer rounded-full border border-white/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
            >
              {PUBLIC_NAV.login}
            </Link>
          )}

          <Link
            href="/donaciones"
            className="cursor-pointer rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition hover:bg-white/90 hover:scale-105 active:scale-95 shadow-xs"
            style={{ color: "#eb5886" }}
          >
            {PUBLIC_NAV.donate}
          </Link>

          <button
            onClick={() => setIsOpen((current) => !current)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
            className="cursor-pointer rounded-xl border border-white/40 p-2 text-white transition hover:bg-white/10 md:hidden"
          >
            {isOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav
          className="border-t border-white/20 px-6 py-4 md:hidden"
          style={{ backgroundColor: "#eb5886" }}
        >
          <ul className="flex flex-col gap-1">
            {PUBLIC_NAV.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-3 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {!user && (
              <li className="mt-1 border-t border-white/20 pt-2">
                <Link
                  href={PUBLIC_NAV.loginHref}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-3 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
                >
                  {PUBLIC_NAV.login}
                </Link>
              </li>
            )}

            <li className="mt-2">
              <Link
                href="/donaciones"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center rounded-full bg-white px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#eb5886] transition hover:bg-white/90 shadow-xs"
              >
                {PUBLIC_NAV.donate}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}