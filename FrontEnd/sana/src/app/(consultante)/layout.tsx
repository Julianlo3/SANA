import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Home, LogOut, PackageCheck, UserRound } from "lucide-react";
import { requireAnyRole } from "@/lib/auth-guard";
import AccountTermsGate from "@/features/my-account/components/account-terms-gate";

/**
 * Layout component for the requester views.
 * @param param0 The props containing the children to render within the layout.
 * @returns A React component that renders the layout for requester views, including a header with navigation links and user information.
 * @param props Component properties.
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
        className="flex items-center gap-3 bg-primary px-6 py-3 lg:px-12"
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
        <span className="text-sm font-bold uppercase tracking-wider text-navy">
          Dejando Huellas Felices
        </span>

        <nav className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-navy transition hover:bg-white/20"
          >
            <Home size={16} aria-hidden />
            Inicio
          </Link>
          <Link
            href="/mi-cuenta#mis-citas"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-navy transition hover:bg-white/20"
          >
            <CalendarCheck size={16} aria-hidden />
            Mis citas
          </Link>
          <Link
            href="/mi-cuenta#mis-datos"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-navy transition hover:bg-white/20"
          >
            <UserRound size={16} aria-hidden />
            Mis datos
          </Link>
          <Link
            href="/mi-cuenta#mis-paquetes"
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-navy transition hover:bg-white/20"
          >
            <PackageCheck size={16} aria-hidden />
            Mis paquetes
          </Link>
          <span className="hidden text-base font-semibold text-navy sm:block">
            {user.fullName}
          </span>
          <a
            href="/auth/logout"
            className="flex items-center gap-2 rounded-full border border-navy/40 px-4 py-2 text-sm font-bold uppercase tracking-wider text-navy transition hover:bg-white/20"
          >
            <LogOut size={16} aria-hidden />
            Salir
          </a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <AccountTermsGate termsAccepted={user.termsAccepted}>{children}</AccountTermsGate>
      </main>
    </div>
  );
}