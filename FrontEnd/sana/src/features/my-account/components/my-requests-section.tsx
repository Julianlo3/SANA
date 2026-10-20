"use client";

import { useState } from "react";
import { CalendarPlus, UserPlus } from "lucide-react";
import Button from "@/components/ui/button";
import InlineMessage from "@/components/feedback/inline-message";
import CancelRequestDialog from "../components/cancel-request-dialog";
import NewDependentRequestDialog from "../components/new-dependent-request-dialog";
import NewRequestDialog from "../components/new-request-dialog";
import RequestCard from "../components/request-card";
import { useMyRequests } from "../hooks/use-my-requests";
import { useOwnProfile } from "../hooks/use-own-profile";
import type { MyRequest } from "../types/my-account-types";

const ACTIVE_STATES = new Set(["pendiente", "asignada", "confirmada"]);

/**
 * Helper function to generate an active summary message based on the number of active appointments.
 * @param count The number of active appointments.
 * @returns The active summary message.
 */
function activeSummary(count: number): string {
  if (count === 0) return "No tienes citas activas por ahora.";
  if (count === 1) return "Tienes 1 cita activa.";
  return `Tienes ${count} citas activas.`;
}

/**
 * Reusable section that displays the consultant's appointments/requests,
 * along with the actions to cancel or create a new one. Requires the
 * user to have the "consultant" role in the backend.
 */
export default function MyRequestsSection() {
  const profile = useOwnProfile();
  const requests = useMyRequests();
  const [requestToCancel, setRequestToCancel] = useState<MyRequest | null>(
    null,
  );
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isNewDependentRequestOpen, setIsNewDependentRequestOpen] =
    useState(false);

  const firstName = profile.profile?.fullName.trim().split(" ")[0] ?? "";
  const activeCount = requests.requests.filter((r) =>
    ACTIVE_STATES.has(r.appState),
  ).length;

  /**
   * Helper function to confirm the cancellation of a request.
   * @returns void
   */
  async function confirmCancel() {
    if (!requestToCancel) return;
    await requests.cancel(requestToCancel);
    setRequestToCancel(null);
  }

  /**
   * Helper function to handle the creation of a new request.
   * @returns void
   */
  function handleCreated() {
    setIsNewRequestOpen(false);
    setIsNewDependentRequestOpen(false);
    requests.reload(
      "Tu solicitud fue enviada. Una asistente te contactará para confirmar la cita.",
    );
  }

  return (
    <>
      {/* Encabezado con saludo y resumen de citas activas */}
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

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => setIsNewRequestOpen(true)}
            disabled={!profile.profile}
          >
            <span className="inline-flex items-center gap-2">
              <CalendarPlus size={16} aria-hidden />
              Solicitar una nueva cita
            </span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsNewDependentRequestOpen(true)}
            disabled={!profile.profile}
          >
            <span className="inline-flex items-center gap-2">
              <UserPlus size={16} aria-hidden />
              Solicitar cita para un dependiente
            </span>
          </Button>
        </div>
      </section>

      {/* Lista de solicitudes */}
      <section id="mis-citas">
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
                <InlineMessage tone="error">
                  {requests.actionError}
                </InlineMessage>
              </div>
            )}
          </>
        )}
      </section>

      {/* Diálogos */}
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
      {isNewDependentRequestOpen && profile.profile && (
        <NewDependentRequestDialog
          profile={profile.profile}
          onCreated={handleCreated}
          onClose={() => setIsNewDependentRequestOpen(false)}
        />
      )}
    </>
  );
}
