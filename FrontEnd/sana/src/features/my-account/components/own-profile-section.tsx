"use client";

import { Lock, UserRound } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import ResidenceFields from "@/features/consultation-requests/components/residence-fields";
import type { Gender } from "@/features/consultation-requests/types/consultation-request-types";
import { keepDigits } from "@/lib/format/text";
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
 * Reusable section that displays and allows editing of the authenticated user's personal data.
 * Used both from MyAccountPage (consultant) and StaffProfilePage (any employee).
 */
export default function OwnProfileSection() {
  const profile = useOwnProfile();

  const documentText =
    profile.profile?.identityDocument != null
      ? `${profile.profile.cardType ?? ""} ${profile.profile.identityDocument}`.trim()
      : "—";

  return (
    <section id="mis-datos">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-primary-dark">
        <UserRound size={22} aria-hidden />
        Mis datos
      </h2>

      {profile.isLoading && (
        <p className="mt-6 text-sm text-text-subtle">
          Cargando tu información…
        </p>
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
                disabled={
                  !profile.isEditing ||
                  !profile.profile.canEditConsultantFields
                }
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
                disabled={
                  !profile.isEditing ||
                  !profile.profile.canEditConsultantFields
                }
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

          </div>

          {profile.profile.canEditConsultantFields && (
            <ResidenceFields
              department={profile.values.department}
              municipality={profile.values.municipality}
              helperText="Selecciona el departamento y el municipio donde resides."
              disabled={!profile.isEditing}
              onDepartmentChange={(department) => {
                profile.setField("department", department);
                profile.setField("municipality", "");
              }}
              onMunicipalityChange={(municipality) =>
                profile.setField("municipality", municipality)
              }
            />
          )}

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
  );
}
