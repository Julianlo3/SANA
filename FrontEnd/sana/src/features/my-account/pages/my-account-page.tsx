"use client";

import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import type { Gender } from "@/features/consultation-requests/types/consultation-request-types";
import { keepDigits } from "@/lib/format/text";
import RequestCard from "../components/request-card";
import { useMyRequests } from "../hooks/use-my-requests";
import { useOwnProfile } from "../hooks/use-own-profile";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "M", label: "Hombre" },
  { value: "F", label: "Mujer" },
  { value: "O", label: "Otro" },
  { value: "P", label: "No quiero especificar" },
];

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-surface-muted";

/**
 * Vista del consultante: su información, el estado de sus citas y, cuando
 * el backend lo permita, cancelar y pedir una nueva sin llenar todo otra vez.
 */
export default function MyAccountPage() {
  const profile = useOwnProfile();
  const requests = useMyRequests();

  const documentText =
    profile.profile?.identityDocument != null
      ? `${profile.profile.cardType ?? ""} ${profile.profile.identityDocument}`.trim()
      : "—";

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-3xl font-bold text-primary-dark">
          Mi cuenta
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Consulta y actualiza tus datos, y revisa en qué va tu cita.
        </p>

        {profile.isLoading && (
          <p className="mt-6 text-sm text-text-subtle">Cargando tu información…</p>
        )}

        {profile.loadError && (
          <div className="mt-6">
            <InlineMessage tone="error">{profile.loadError}</InlineMessage>
          </div>
        )}

        {profile.profile && (
          <div className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6">
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

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-primary-dark">
            Mis citas
          </h2>
          <Button variant="secondary" disabled onClick={() => undefined}>
            Solicitar una nueva cita
          </Button>
        </div>

        {requests.isLoading && (
          <p className="mt-6 text-sm text-text-subtle">Cargando tus citas…</p>
        )}

        {requests.loadError && (
          <div className="mt-6">
            <InlineMessage tone="error">{requests.loadError}</InlineMessage>
          </div>
        )}

        {!requests.isLoading && !requests.loadError && (
          <>
            {requests.requests.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
                Todavía no tienes solicitudes de cita.
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {requests.requests.map((request) => (
                  <RequestCard key={request.appId} request={request} />
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-text-subtle">
              Pronto podrás cancelar una cita y pedir una nueva desde aquí.
            </p>
          </>
        )}
      </section>
    </div>
  );
}