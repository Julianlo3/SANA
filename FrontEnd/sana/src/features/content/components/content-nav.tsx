"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/contenido/institucional", label: "Institucional" },
  { href: "/contenido/noticias", label: "Noticias" },
  { href: "/contenido/galeria", label: "Galería" },
  { href: "/contenido/banners", label: "Banners" },
];

export default function ContentNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones de contenido"
      className="relative z-10 mx-auto mb-8 flex max-w-4xl gap-6 border-b border-border"
    >
      {LINKS.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
