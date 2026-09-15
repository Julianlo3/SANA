import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import StatusCard from "@/features/auth/components/status-card";

export default function RestrictedAccessPage() {
  return (
    <StatusCard
      icon={<Lock size={26} />}
      tone="danger"
      title="Acceso restringido"
      actions={
        <>
          <a href="mailto:soporte@pendiente.org" className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark">
            <Mail size={16} />
            Contactar soporte
          </a>
          <Link href="/" className="rounded-xl border border-border py-3 font-semibold text-text-muted transition hover:border-text-muted hover:text-text">
            Volver al inicio
          </Link>
        </>
      }
    >
      <p>
        Tu cuenta se encuentra bloqueada o desactivada, por lo que no puedes
        acceder a la plataforma en este momento.
      </p>
      <p className="mt-3">
        Comunícate con el administrador del sistema para más información.
      </p>
    </StatusCard>
  );
}