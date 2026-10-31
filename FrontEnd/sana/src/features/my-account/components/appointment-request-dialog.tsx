import type { ReactNode } from "react";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";

type Props = {
  readonly title: string;
  readonly icon: ReactNode;
  readonly missing: readonly string[];
  readonly isSaving: boolean;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly children: ReactNode;
};

export default function AppointmentRequestDialog({
  title,
  icon,
  missing,
  isSaving,
  onClose,
  onSubmit,
  children,
}: Props) {
  const isBlocked = missing.length > 0;

  return (
    <Modal
      title={title}
      icon={icon}
      onClose={onClose}
      footer={
        isBlocked ? (
          <Button variant="secondary" onClick={onClose}>
            Entendido
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={isSaving}>
              {isSaving ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </>
        )
      }
    >
      {isBlocked ? (
        <p>
          Antes de solicitar la cita completa en «Editar mis datos»:{" "}
          {missing.join(", ")}.
        </p>
      ) : (
        children
      )}
    </Modal>
  );
}
