"use client";

import { useState } from "react";
import { Ban, UserMinus, UserCheck, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { User } from "@/lib/mocks/users";
import type { UserAction } from "./UserActionsMenu";

type Props = {
  action: UserAction;
  user: User;
  onConfirm: (action: UserAction, user: User, reason?: string) => void;
  onClose: () => void;
};

function IconBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "accent" | "danger";
}) {
  const styles =
    tone === "danger"
      ? "bg-red-500/15 text-red-400"
      : "bg-accent/15 text-accent";

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${styles}`}
    >
      {children}
    </div>
  );
}

export default function UserActionDialog({
  action,
  user,
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState("");

  if (action === "block") {
    return (
      <Modal
        title="Bloquear usuario"
        icon={<IconBadge tone="danger"><Ban size={20} /></IconBadge>}
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => onConfirm(action, user)}>
              <Ban size={15} />
              Bloquear usuario
            </Button>
          </>
        }
      >
        <p>
          ¿Está seguro de que desea bloquear a{" "}
          <strong className="text-text">{user.fullName}</strong>?
        </p>

        <ul className="mt-4 space-y-2 rounded-xl bg-surface-raised/60 p-4 text-xs">
          <li>Se cerrarán todas sus sesiones activas inmediatamente.</li>
          <li>
            No podrá iniciar sesión hasta que un administrador revierta esta
            acción.
          </li>
          <li>
            Sus registros asociados permanecerán intactos pero inaccesibles para
            él.
          </li>
        </ul>
      </Modal>
    );
  }

  if (action === "deactivate") {
    return (
      <Modal
        title="Desactivar cuenta"
        icon={<IconBadge tone="danger"><UserMinus size={20} /></IconBadge>}
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => onConfirm(action, user, reason)}
            >
              Desactivar cuenta
            </Button>
          </>
        }
      >
        <p>
          Vas a desactivar la cuenta de{" "}
          <strong className="text-text">{user.fullName}</strong>.
        </p>

        <ul className="mt-4 space-y-2 rounded-xl bg-surface-raised/60 p-4 text-xs">
          <li>El usuario perderá el acceso inmediato a la plataforma.</li>
          <li>Su historial de acciones se conservará intacto para auditoría.</li>
          <li>Las tareas pendientes asignadas requerirán reasignación manual.</li>
        </ul>

        <label className="mt-5 block">
          <span className="text-xs uppercase tracking-wider text-text-subtle">
            Motivo de desactivación (opcional)
          </span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Ej. Fin de contrato, cambio de rol..."
            className="mt-2 w-full resize-none rounded-xl bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <span className="block text-right text-[11px] text-text-subtle">
            {reason.length}/200
          </span>
        </label>
      </Modal>
    );
  }

  if (action === "reactivate") {
    return (
      <Modal
        title="Reactivar acceso"
        icon={<IconBadge tone="accent"><UserCheck size={20} /></IconBadge>}
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => onConfirm(action, user)}>
              <UserCheck size={15} />
              Reactivar usuario
            </Button>
          </>
        }
      >
        <p>
          Al reactivar, <strong className="text-text">{user.fullName}</strong>{" "}
          recuperará el acceso inmediato al sistema conservando su rol de{" "}
          <strong className="text-text">{user.role}</strong>.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title="No se puede eliminar el usuario"
      icon={<IconBadge tone="danger"><AlertTriangle size={20} /></IconBadge>}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar operación
          </Button>
          <Button onClick={() => onConfirm("deactivate", user)}>
            Proceder a desactivar
          </Button>
        </>
      }
    >
      <p>
        El sistema ha bloqueado esta acción para preservar la trazabilidad de
        los datos. Este usuario tiene registros asociados.
      </p>

      <div className="mt-4 rounded-xl bg-surface-raised/60 p-4">
        <p className="text-xs uppercase tracking-wider text-text-subtle">
          Alternativa recomendada
        </p>
        <p className="mt-2 text-sm font-semibold text-text">
          Desactivar la cuenta
        </p>
        <p className="mt-1 text-xs">
          Revoca el acceso inmediatamente, pero mantiene intacto su historial y
          sus registros administrativos para futuras auditorías.
        </p>
      </div>
    </Modal>
  );
}