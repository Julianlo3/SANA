import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Home, LogOut, UserRound } from "lucide-react";
import { requireAnyRole } from "@/lib/auth-guard";

/**
 * Layout component for the requester views.
 * @param param0 The props containing the children to render within the layout.
 * @returns A React component that renders the layout for requester views, including a header with navigation links and user information.
 */
export default async function RequesterLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const user = await requireAnyRole(["consultante"]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header
        className="flex items-center gap-3 px-6 py-3 lg:px-12"
        style={{ backgroundColor: "#eb5886" }}
      >
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white" aria-label="Ir al inicio">
          <Image
            src="/brand/isotipo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        </Link>
        <span className="text-xs font-bold uppercase tracking-wider text-white">
          Dejando Huellas Felices
        </span>

        <nav className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
          >
            <Home size={14} aria-hidden />
            Inicio
          </Link>
          <Link
            href="/mi-cuenta#mis-citas"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
          >
            <CalendarCheck size={14} aria-hidden />
            Mis citas
          </Link>
          <Link
            href="/mi-cuenta#mis-datos"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
          >
            <UserRound size={14} aria-hidden />
            Mis datos
          </Link>
          <span className="hidden text-sm font-semibold text-white sm:block">
            {user.fullName}
          </span>
          <a
            href="/auth/logout"
            className="flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
          >
            <LogOut size={14} aria-hidden />
            Salir
          </a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}