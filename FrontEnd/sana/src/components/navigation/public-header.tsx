"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { PUBLIC_NAV } from "@/content/navigation";

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src={PUBLIC_NAV.logo.src}
            alt={PUBLIC_NAV.logo.alt}
            width={400}
            height={92}
            priority
            className="h-12 w-auto"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {PUBLIC_NAV.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-text-muted transition hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-text-muted transition hover:text-primary md:block"
          >
            {PUBLIC_NAV.staffAccess}
          </Link>

          <button
            type="button"
            className="cursor-pointer rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-strong"
          >
            {PUBLIC_NAV.donate}
          </button>

          <button
            onClick={() => setIsOpen((current) => !current)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
            className="cursor-pointer rounded-xl border border-border p-2 text-text-muted transition hover:bg-surface-muted hover:text-text md:hidden"
          >
            {isOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav className="border-t border-border bg-background px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {PUBLIC_NAV.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-semibold text-text-muted transition hover:bg-primary-soft hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}

            <li className="mt-1 border-t border-border pt-1">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-semibold text-primary transition hover:bg-primary-soft"
              >
                {PUBLIC_NAV.staffAccess}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}