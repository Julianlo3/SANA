"use client";

import { useState } from "react";
import { CalendarPlus, Lock, UserRound } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import type { Gender } from "@/features/consultation-requests/types/consultation-request-types";
import { keepDigits } from "@/lib/format/text";
import CancelRequestDialog from "../components/cancel-request-dialog";
import NewRequestDialog from "../components/new-request-dialog";
import RequestCard from "../components/request-card";
import { useMyRequests } from "../hooks/use-my-requests";
import { useOwnProfile } from "../hooks/use-own-profile";
import type { MyRequest } from "../types/my-account-types";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "M", label: "Hombre" },
  { value: "F", label: "Mujer" },
  { value: "O", label: "Otro" },
  { value: "P", label: "No quiero especificar" },
];

const ACTIVE_STATES = ["pendiente", "asignada", "confirmada"];

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-surface-muted";

function activeSummary(count: number): string {
  if (count === 0) return "No tienes citas activas por ahora.";
  if (count === 1) return "Tienes 1 cita activa.";
  return `Tienes ${count} citas activas.`;
}

/**
 * Vista del consultante: saludo, sus citas con el estado de cada una y, más
 * abajo, sus datos. Puede cancelar o retirar una solicitud y pedir una cita
 * nueva para sí mismo sin llenar todo el formulario otra vez.
 */
export default function MyAccountPage() {
  const profile = useOwnProfile();
  const requests = useMyRequests();
  const [requestToCancel, setRequestToCancel] = useState<MyRequest | null>(
    null,
  );
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  const firstName = profile.profile?.fullName.trim().split(" ")[0] ?? "";
  const activeCount = requests.requests.filter((request) =>
    ACTIVE_STATES.includes(request.appState),
  ).length;

  const documentText =
    profile.profile?.identityDocument != null
      ? `${profile.profile.cardType ?? ""} ${profile.profile.identityDocument}`.trim()
      : "—";

  async function confirmCancel() {
    if (!requestToCancel) return;
    await requests.cancel(requestToCancel);
    setRequestToCancel(null);
  }

  function handleCreated() {
    setIsNewRequestOpen(false);
    requests.reload(
      "Tu solicitud fue enviada. Una asistente te contactará para confirmar la cita.",
    );
  }

  return (
    <div className="space-y-10">
      <section
        className="rounded-3xl p-6 sm:p-8"
        style={{ backgroundColor: "#fbeaf0" }}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-primary-dark">
          Mi cuenta
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-primary-dark sm:text-4xl">
          {firstName ? `¡Hola, ${firstName}!` : "¡Hola!"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {requests.isLoading
            ? "Cargando tus citas…"
            : activeSummary(activeCount)}
        </p>

        <div className="mt-6">
          <Button
            onClick={() => setIsNewRequestOpen(true)}
            disabled={!profile.profile}
          >
            <span className="inline-flex items-center gap-2">
              <CalendarPlus size={16} aria-hidden />
              Solicitar una nueva cita
            </span>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold text-primary-dark">
          Mis citas
        </h2>

        {requests.loadError && (
          <div className="mt-6">
            <InlineMessage tone="error">{requests.loadError}</InlineMessage>
          </div>
        )}

        {!requests.isLoading && !requests.loadError && (
          <>
            {requests.requests.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
                Todavía no tienes solicitudes. Cuando pidas una cita, la verás
                aquí con su estado.
              </p>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {requests.requests.map((request) => (
                  <RequestCard
                    key={request.appId}
                    request={request}
                    onCancel={setRequestToCancel}
                  />
                ))}
              </div>
            )}

            {requests.notice && (
              <div className="mt-4">
                <InlineMessage tone="success">{requests.notice}</InlineMessage>
              </div>
            )}

            {requests.actionError && (
              <div className="mt-4">
                <InlineMessage tone="error">{requests.actionError}</InlineMessage>
              </div>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-primary-dark">
          <UserRound size={22} aria-hidden />
          Mis datos
        </h2>

        {profile.isLoading && (
          <p className="mt-6 text-sm text-text-subtle">Cargando tu información…</p>
        )}

        {profile.loadError && (
          <div className="mt-6">
            <InlineMessage tone="error">{profile.loadError}</InlineMessage>
          </div>
        )}

        {profile.profile && (
          <div className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <TextField
              label="Nombre completo"
              required
              value={profile.values.fullName}
              error={profile.errors.fullName}
              maxLength={100}
              disabled={!profile.isEditing}
              onChange={(value) => profile.setField("fullName", value)}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Documento de identidad"
                locked
                value={documentText}
                hint="Identifica tu cuenta y no se puede cambiar."
              />
              <TextField
                label="Correo"
                locked
                value={profile.profile.email}
                hint="Es la cuenta con la que inicias sesión."
              />
            </div>

            <p className="flex items-center gap-2 text-xs text-text-subtle">
              <Lock size={12} aria-hidden />
              El documento y el correo no se pueden editar.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Teléfono"
                required
                type="tel"
                inputMode="numeric"
                value={profile.values.phone}
                error={profile.errors.phone}
                maxLength={12}
                disabled={!profile.isEditing}
                onChange={(value) => profile.setField("phone", keepDigits(value))}
              />

              <label className="block">
                <span className="text-sm font-medium text-text">
                  Fecha de nacimiento
                </span>
                <input
                  type="date"
                  value={profile.values.birthdate}
                  max={new Date().toISOString().split("T")[0]}
                  disabled={!profile.isEditing}
                  onChange={(event) =>
                    profile.setField("birthdate", event.target.value)
                  }
                  className={INPUT_CLASS}
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-text">Género</span>
                <select
                  value={profile.values.gender}
                  disabled={!profile.isEditing}
                  onChange={(event) =>
                    profile.setField("gender", event.target.value as Gender | "")
                  }
                  className={`${INPUT_CLASS} cursor-pointer`}
                >
                  <option value="">Sin indicar</option>
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <TextField
                label="Zona de residencia"
                value={profile.values.residenceZone}
                maxLength={255}
                placeholder="Municipio, Departamento"
                disabled={!profile.isEditing}
                onChange={(value) => profile.setField("residenceZone", value)}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {profile.isEditing ? (
                <>
                  <Button onClick={profile.save} disabled={profile.isSaving}>
                    {profile.isSaving ? "Guardando…" : "Guardar cambios"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={profile.cancelEditing}
                    disabled={profile.isSaving}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button variant="secondary" onClick={profile.startEditing}>
                  Editar mis datos
                </Button>
              )}
            </div>

            {profile.wasSaved && (
              <InlineMessage tone="success">
                Tus datos quedaron guardados.
              </InlineMessage>
            )}

            {profile.saveError && (
              <InlineMessage tone="error">{profile.saveError}</InlineMessage>
            )}
          </div>
        )}
      </section>

      {requestToCancel && (
        <CancelRequestDialog
          request={requestToCancel}
          isSaving={requests.cancelingId === requestToCancel.appId}
          onConfirm={confirmCancel}
          onClose={() => setRequestToCancel(null)}
        />
      )}

      {isNewRequestOpen && profile.profile && (
        <NewRequestDialog
          profile={profile.profile}
          onCreated={handleCreated}
          onClose={() => setIsNewRequestOpen(false)}
        />
      )}
    </div>
  );
}