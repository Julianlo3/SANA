import Link from "next/link";
import { CloudOff, Home, RefreshCw } from "lucide-react";
import StatusCard from "@/features/auth/components/status-card";

/**
 * Renders the service unavailable page.
 * @returns A React component displaying a message indicating that the service is temporarily unavailable.
 */
export default function ServiceUnavailablePage() {
  return (
    <StatusCard
      icon={<CloudOff size={26} />}
      tone="danger"
      title="Servicio temporalmente no disponible"
      actions={
        <>
          <Link
            href="/panel"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark"
          >
            <RefreshCw size={16} />
            Intentar de nuevo
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 font-semibold text-text-muted transition hover:border-text-muted hover:text-text"
          >
            <Home size={16} />
            Volver al inicio
          </Link>
        </>
      }
    >
      <p>
        En este momento no podemos validar tu cuenta. Inténtalo de nuevo en unos
        minutos.
      </p>
    </StatusCard>
  );
}
