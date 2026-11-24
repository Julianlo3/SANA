import type { ReactNode } from "react";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";

/**
 * Defines the props type.
 */
type Props = {
  readonly title: string;
  readonly icon: ReactNode;
  readonly missing: readonly string[];
  readonly isSaving: boolean;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly children: ReactNode;
  /** Optional business-rule message that blocks general valuation submission. */
  readonly blockedMessage?: ReactNode;
  /** Prevents submission while keeping editable requester fields visible. */
  readonly submissionBlocked?: boolean;
};

/**
 * Renders the appointment request dialog component.
 * @param props Component properties.
 * @returns Rendered component.
 */
export default function AppointmentRequestDialog({
  title,
  icon,
  missing,
  isSaving,
  onClose,
  onSubmit,
  children,
  blockedMessage,
  submissionBlocked = false,
}: Props) {
  const isBlocked = missing.length > 0 || submissionBlocked;

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
      {missing.length > 0 ? (
        <p>
          Antes de solicitar la cita completa en «Editar mis datos»:{" "}
          {missing.join(", ")}.
        </p>
      ) : (
        <>
          {blockedMessage}
          {children}
        </>
      )}
    </Modal>
  );
}
