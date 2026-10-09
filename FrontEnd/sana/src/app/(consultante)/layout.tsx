import Image from "next/image";
import { LogOut } from "lucide-react";
import { requireAnyRole } from "@/lib/auth-guard";

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
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
          <Image
            src="/brand/isotipo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-white">
          Dejando Huellas Felices
        </span>

        <div className="ml-auto flex items-center gap-4">
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}