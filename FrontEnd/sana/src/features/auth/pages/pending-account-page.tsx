import Link from "next/link";
import { UserX, Mail } from "lucide-react";
import StatusCard from "@/features/auth/components/status-card";

export default function PendingAccountPage() {
  return (
    <StatusCard
      icon={<UserX size={26} />}
      title="Cuenta no registrada"
      actions={
        <>
          <a href="mailto:soporte@pendiente.org" className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark">
            <Mail size={16} />
            Contactar a la fundación
          </a>
          <Link href="/login" className="rounded-xl border border-border py-3 font-semibold text-text-muted transition hover:border-text-muted hover:text-text">
            Volver al inicio de sesión
          </Link>
        </>
      }
    >
      <p>
        El correo con el que intentas ingresar no está registrado en la
        plataforma.
      </p>
      <p className="mt-3">
        Las cuentas las crea el administrador de la Fundación Dejando Huellas
        Felices. Si crees que deberías tener acceso, comunícate con la
        administración.
      </p>
    </StatusCard>
  );
}