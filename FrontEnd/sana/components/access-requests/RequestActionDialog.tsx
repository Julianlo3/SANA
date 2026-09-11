"use client";

import { useState } from "react";
import { ShieldCheck, Ban } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { ROLES } from "@/lib/mocks/access-requests";
import type { AccessRequest } from "@/lib/mocks/access-requests";

export type RequestAction = "approve" | "reject";

type Props = {
  action: RequestAction;
  request: AccessRequest;
  onConfirm: (action: RequestAction, request: AccessRequest, value?: string) => void;
  onClose: () => void;
};

export default function RequestActionDialog({
  action,
  request,
  onConfirm,
  onClose,
}: Props) {
  const [roleId, setRoleId] = useState("");
  const [reason, setReason] = useState("");
  const [showError, setShowError] = useState(false);

  const initials = request.fullName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  if (action === "approve") {
    function handleApprove() {
      if (!roleId) {
        setShowError(true);
        return;
      }
      onConfirm("approve", request, roleId);
    }

    return (
      <Modal
        title="Aprobar cuenta"
        subtitle="Revisión de seguridad"
        icon={
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <ShieldCheck size={20} />
          </div>
        }
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleApprove}>Confirmar aprobación</Button>
          </>
        }
      >
        <div className="flex items-center gap-3 rounded-xl bg-surface-raised/60 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-dark text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-text">
              {request.fullName}
            </p>
            <p className="truncate text-xs text-text-subtle">{request.email}</p>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-xs uppercase tracking-wider text-text-subtle">
            Asignar rol <span className="text-red-400">*</span>
          </span>
          <select
            value={roleId}
            onChange={(event) => {
              setRoleId(event.target.value);
              setShowError(false);
            }}
            className={`mt-2 w-full cursor-pointer rounded-xl bg-surface-raised px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 ${
              showError ? "ring-2 ring-red-500/60" : "focus:ring-primary/50"
            }`}
          >
            <option value="">Seleccionar perfil de acceso...</option>
            {ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          {showError && (
            <span className="mt-2 block text-xs text-red-400">
              Debe asignar un rol antes de aprobar la cuenta.
            </span>
          )}
        </label>

        <p className="mt-5 rounded-xl bg-surface-raised/60 p-4 text-xs">
          Al aprobar esta cuenta se le notificará por correo que ya puede
          ingresar a la plataforma con su cuenta de Google.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title="Rechazar solicitud"
      icon={
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <Ban size={20} />
        </div>
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm("reject", request, reason)}
          >
            Confirmar rechazo
          </Button>
        </>
      }
    >
      <p>
        Está a punto de rechazar la solicitud de acceso de{" "}
        <strong className="text-text">{request.fullName}</strong>. Esta acción no
        se puede deshacer y el usuario será notificado.
      </p>

      <label className="mt-5 block">
        <span className="text-xs uppercase tracking-wider text-text-subtle">
          Motivo del rechazo (opcional)
        </span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Indique brevemente el motivo para los registros de auditoría..."
          className="mt-2 w-full resize-none rounded-xl bg-surface-raised px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <span className="block text-right text-[11px] text-text-subtle">
          {reason.length}/200
        </span>
      </label>
    </Modal>
  );
}