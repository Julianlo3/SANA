import Link from "next/link";

const navLinks = [
  { label: "Quiénes somos", href: "#about" },
  { label: "Programas", href: "#programs" },
  { label: "Noticias", href: "#news" },
  { label: "Contacto", href: "#contact" },
];

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <span className="font-display text-lg font-bold text-white">
              S
            </span>
          </div>

          <span className="font-display text-lg font-bold leading-tight text-primary-dark">
            Dejando Huellas
          </span>
        </Link>

        {/* Navegación */}
        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-text-muted transition hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Acciones */}
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-text-muted transition hover:text-primary sm:block"
          >
            Acceso personal
          </Link>

          <button
            type="button"
            className="cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-strong"
          >
            Dona aquí
          </button>
        </div>
      </div>
    </header>
  );
}