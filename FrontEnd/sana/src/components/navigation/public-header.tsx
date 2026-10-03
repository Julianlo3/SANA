"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { PUBLIC_NAV } from "@/content/navigation";

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);

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
          <Link
            href="/iniciar-sesion"
            className="hidden text-xs font-bold uppercase tracking-wider text-white transition hover:text-white/80 md:block"
          >
            {PUBLIC_NAV.staffAccess}
          </Link>

          <button
            type="button"
            className="cursor-pointer rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition hover:bg-white/90"
            style={{ color: "#eb5886" }}
          >
            {PUBLIC_NAV.donate}
          </button>

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

            <li className="mt-1 border-t border-white/20 pt-1">
              <Link
                href="/iniciar-sesion"
                onClick={() => setIsOpen(false)}
                className="block rounded-xl px-3 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
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