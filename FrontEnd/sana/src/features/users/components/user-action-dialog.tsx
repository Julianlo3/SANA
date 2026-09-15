"use client";

import { useState } from "react";
import { AlertTriangle, Ban, UserCheck, UserMinus } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import type { User, UserAction } from "../types/user-types";

type Props = {
  action: Exclude<UserAction, "edit">;
  user: User;
  isSaving: boolean;
  error: string | null;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
};

type DialogCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "accent" | "danger";
  icon: React.ReactNode;
  asksForReason: boolean;
};

const COPY: Record<Props["action"], DialogCopy> = {
  block: {
    title: "Bloquear acceso",
    description:
      "La persona no podrá entrar a SANA hasta que le reactives el acceso. Su información y su historial se conservan.",
    confirmLabel: "Bloquear acceso",
    tone: "danger",
    icon: <Ban size={20} aria-hidden />,
    asksForReason: true,
  },
  deactivate: {
    title: "Desactivar cuenta",
    description:
      "La cuenta queda inactiva y deja de aparecer como personal disponible. Puedes reactivarla cuando quieras.",
    confirmLabel: "Desactivar cuenta",
    tone: "accent",
    icon: <UserMinus size={20} aria-hidden />,
    asksForReason: true,
  },
  reactivate: {
    title: "Reactivar acceso",
    description:
      "La persona vuelve a entrar con su cuenta de Google y recupera los roles que tenía asignados.",
    confirmLabel: "Reactivar acceso",
    tone: "accent",
    icon: <UserCheck size={20} aria-hidden />,
    asksForReason: false,
  },
  delete: {
    title: "Eliminar usuario",
    description:
      "Esta acción no se puede deshacer. Si solo quieres quitarle el acceso por un tiempo, es mejor bloquear la cuenta.",
    confirmLabel: "Eliminar definitivamente",
    tone: "danger",
    icon: <AlertTriangle size={20} aria-hidden />,
    asksForReason: false,
  },
};

function IconBadge({
  tone,
  children,
}: {
  tone: "accent" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
        tone === "danger"
          ? "bg-danger-soft text-danger"
          : "bg-primary-soft text-primary"
      }`}
    >
      {children}
    </div>
  );
}

export default function UserActionDialog({
  action,
  user,
  isSaving,
  error,
  onConfirm,
  onClose,
}: Props) {
  const [reason, setReason] = useState("");
  const copy = COPY[action];

  return (
    <Modal
      title={copy.title}
      icon={<IconBadge tone={copy.tone}>{copy.icon}</IconBadge>}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant={copy.tone === "danger" ? "danger" : "primary"}
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={isSaving}
          >
            {isSaving ? "Guardando…" : copy.confirmLabel}
          </Button>
        </>
      }
    >
      <p>
        <span className="font-semibold text-text">{user.fullName}</span> —{" "}
        {user.email}
      </p>

      <p className="mt-3">{copy.description}</p>

      {copy.asksForReason && (
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-text">
            Motivo (opcional)
          </span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Queda registrado en el historial de la cuenta."
            className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
      )}

      {error && (
        <div className="mt-4">
          <InlineMessage tone="error">{error}</InlineMessage>
        </div>
      )}
    </Modal>
  );
}