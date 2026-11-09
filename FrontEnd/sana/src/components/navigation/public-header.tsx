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
    <header className="sticky top-0 z-30 bg-primary">
      <div className="flex items-center gap-2 px-3 py-3 min-[380px]:gap-3 min-[380px]:px-4 sm:gap-4 sm:px-6 lg:px-12">
        <Link href="/" className="relative flex min-w-0 shrink-0 items-center before:absolute before:content-[''] before:inset-x-0 before:-inset-y-2.5">
          <Image
            src={PUBLIC_NAV.logo.src}
            alt={PUBLIC_NAV.logo.alt}
            width={400}
            height={92}
            priority
            sizes="(max-width: 640px) 140px, 200px"
            className="aspect-[400/92] h-6 w-auto max-w-none shrink-0 brightness-0 invert min-[360px]:h-7 sm:h-10 lg:h-11"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-6 lg:flex xl:gap-8">
          {PUBLIC_NAV.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-navy transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 min-[380px]:gap-2 sm:gap-3 lg:ml-0">
          {user ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                aria-label="Abrir menú de cuenta"
                aria-haspopup="true"
                aria-controls="public-account-menu"
                aria-expanded={isAccountMenuOpen}
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-navy before:absolute before:content-[''] before:-inset-1.5 min-[380px]:h-9 min-[380px]:w-9 text-sm font-semibold text-white shadow-sm transition hover:ring-2 hover:ring-white/60"
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
              className="hidden cursor-pointer whitespace-nowrap rounded-full border border-navy/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy transition hover:bg-white/20 sm:inline-flex"
            >
              {PUBLIC_NAV.login}
            </Link>
          )}

          <Link
            href="/donaciones"
            className="relative cursor-pointer whitespace-nowrap rounded-full bg-white px-3 py-2 before:absolute before:content-[''] before:inset-x-0 before:-inset-y-1.5 text-xs font-bold uppercase tracking-wide text-navy shadow-xs transition hover:scale-105 hover:bg-white/90 active:scale-95 min-[380px]:px-3.5 min-[380px]:tracking-wider sm:px-5 sm:py-2.5"
          >
            {PUBLIC_NAV.donate}
          </Link>

          <button
            onClick={() => setIsOpen((current) => !current)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
            className="relative cursor-pointer rounded-xl border border-navy/30 p-1.5 before:absolute before:content-[''] before:-inset-1.5 text-navy transition hover:bg-white/20 min-[380px]:p-2 lg:hidden"
          >
            {isOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav className="border-t border-navy/15 bg-primary px-4 py-4 sm:px-6 lg:hidden">
          <ul className="flex flex-col gap-1">
            {PUBLIC_NAV.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-3 py-3.5 text-xs font-bold uppercase tracking-wider text-navy transition hover:bg-white/20"
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {!user && (
              <li className="mt-1 border-t border-navy/15 pt-2">
                <Link
                  href={PUBLIC_NAV.loginHref}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-3 py-3.5 text-xs font-bold uppercase tracking-wider text-navy transition hover:bg-white/20"
                >
                  {PUBLIC_NAV.login}
                </Link>
              </li>
            )}

            <li className="mt-2">
              <Link
                href="/donaciones"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center rounded-full bg-white px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-navy shadow-xs transition hover:bg-white/90"
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