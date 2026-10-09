import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { formatDateTime } from "@/features/appointments/lib/appointment-format";
import type { MyRequest } from "../types/my-account-types";

type Props = {
  readonly request: MyRequest;
  readonly isSaving: boolean;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
};

/** Pide confirmación antes de cancelar una cita o retirar una solicitud. */
export default function CancelRequestDialog({
  request,
  isSaving,
  onConfirm,
  onClose,
}: Props) {
  const isConfirmed = request.appState === "confirmada";

  const copy = isConfirmed
    ? {
        title: "Cancelar cita",
        description:
          "Vas a cancelar tu cita. Para volver a atenderte tendrás que pedir otra.",
        confirm: "Sí, cancelar cita",
      }
    : {
        title: "Retirar solicitud",
        description:
          "Vas a retirar tu solicitud. Para volver a pedir una cita tendrás que enviar otra.",
        confirm: "Sí, retirar solicitud",
      };

  return (
    <Modal
      title={copy.title}
      icon={
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle size={20} aria-hidden />
        </div>
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Volver
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isSaving}>
            {isSaving ? "Guardando…" : copy.confirm}
          </Button>
        </>
      }
    >
      <p>
        <span className="font-semibold text-text">
          Solicitud #{request.appId}
        </span>
        {request.appDate ? ` — ${formatDateTime(request.appDate)}` : ""}
      </p>

      <p className="mt-3">{copy.description}</p>
    </Modal>
  );
}