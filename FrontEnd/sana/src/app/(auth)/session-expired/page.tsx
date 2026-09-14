import Link from "next/link";
import { Clock, LogIn } from "lucide-react";
import StatusCard from "@/features/auth/components/status-card";

export default function SessionExpiredPage() {
  return (
    <StatusCard
      icon={<Clock size={26} />}
      title="Sesión expirada"
      actions={
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark"
        >
          <LogIn size={16} />
          Iniciar sesión de nuevo
        </Link>
      }
    >
      <p>
        Por seguridad y protección de los datos de los consultantes, tu sesión
        se cerró automáticamente tras un periodo de inactividad.
      </p>
    </StatusCard>
  );
}