import { TriangleAlert } from "lucide-react";
import { EMERGENCY_NOTICE } from "@/content/legal";

const PHONE_LINK =
  "font-bold underline underline-offset-2 hover:text-primary-dark";

/** Notice shown at the top of the appointment request forms. */
export default function EmergencyNotice({
  className = "",
}: Readonly<{ className?: string }>) {
  return (
    <aside
      role="note"
      aria-label="Aviso de no emergencias"
      className={`flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger-soft/40 p-4 text-sm leading-relaxed text-text ${className}`}
    >
      <TriangleAlert size={20} className="mt-0.5 shrink-0 text-danger" aria-hidden />
      <p>
        <strong className="font-bold">{EMERGENCY_NOTICE.title}</strong> Si tú o
        alguien más está en peligro, llama a la{" "}
        <a href={`tel:${EMERGENCY_NOTICE.emergencyLine}`} className={PHONE_LINK}>
          Línea {EMERGENCY_NOTICE.emergencyLine}
        </a>{" "}
        o acude a urgencias. Si un niño, niña o adolescente está en riesgo de
        maltrato o abuso, llama a la{" "}
        <a href={`tel:${EMERGENCY_NOTICE.childLine}`} className={PHONE_LINK}>
          Línea {EMERGENCY_NOTICE.childLine}
        </a>{" "}
        del ICBF.
      </p>
    </aside>
  );
}
