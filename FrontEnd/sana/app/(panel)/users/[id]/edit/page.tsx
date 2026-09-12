"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageDecor from "@/components/ui/PageDecor";
import Button from "@/components/ui/Button";
import { mockUsers, ROLE_CATALOG } from "@/lib/mocks/users";
import { ArrowLeft, Info, Lock, Check } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditUserPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const user = mockUsers.find((item) => item.id === Number(id));

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [identityDocument, setIdentityDocument] = useState(
    user?.identityDocument ?? "",
  );
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [roles, setRoles] = useState(user?.roles ?? []);
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-text">
          Usuario no encontrado
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          El usuario que intentas editar no existe o fue eliminado.
        </p>
        <div className="mt-8 flex justify-center">
          <Button onClick={() => router.push("/users")}>
            Volver a usuarios
          </Button>
        </div>
      </div>
    );
  }

  function toggleRole(roleId: number) {
    setSaved(false);
    setRoles((current) => {
      const exists = current.find((role) => role.id === roleId);

      if (exists) {
        return current.filter((role) => role.id !== roleId);
      }

      const catalogRole = ROLE_CATALOG.find((role) => role.id === roleId);
      if (!catalogRole) return current;

      return [...current, { ...catalogRole, active: true }];
    });
  }

  function toggleRoleActive(roleId: number) {
    setSaved(false);
    setRoles((current) =>
      current.map((role) =>
        role.id === roleId ? { ...role, active: !role.active } : role,
      ),
    );
  }

  function handleSave() {
    console.log("Guardar:", { id, fullName, identityDocument, phone, roles });
    setSaved(true);
  }

  return (
    <>
      <PageDecor variant="users" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-text"
        >
          <ArrowLeft size={16} />
          Volver a usuarios
        </Link>

        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-primary-dark">
          Editar Perfil
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Modifica la información y los roles de acceso de {user.fullName}.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <label className="block">
            <span className="text-sm font-semibold text-text">
              Nombre completo
            </span>
            <input
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                setSaved(false);
              }}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-text">
              Documento de identidad
            </span>
            <input
              value={identityDocument}
              onChange={(event) => {
                setIdentityDocument(event.target.value);
                setSaved(false);
              }}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>

          <label className="mt-5 block">
            <span className="flex items-center gap-2 text-sm font-semibold text-text-subtle">
              <Lock size={14} />
              Correo de Google
            </span>
            <input
              value={user.email}
              disabled
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text-subtle"
            />
            <span className="mt-1.5 block text-xs text-text-subtle">
              El correo no se puede modificar porque es la cuenta con la que
              inicia sesión.
            </span>
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-text">
              Teléfono de contacto
            </span>
            <input
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setSaved(false);
              }}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-bold text-text">
            Roles asignados
          </h2>
          <p className="mt-1 text-xs text-text-subtle">
            Marca los roles que tiene la persona. Puedes desactivar un rol
            temporalmente sin quitárselo.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {ROLE_CATALOG.map((catalogRole) => {
              const assigned = roles.find((role) => role.id === catalogRole.id);

              return (
                <div
                  key={catalogRole.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    assigned
                      ? "border-primary/40 bg-primary-soft/50"
                      : "border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(assigned)}
                    onChange={() => toggleRole(catalogRole.id)}
                    className="h-4 w-4 cursor-pointer accent-primary"
                    aria-label={`Asignar rol ${catalogRole.name}`}
                  />

                  <span className="flex-1 text-sm text-text">
                    {catalogRole.name}
                  </span>

                  {assigned && (
                    <button
                      onClick={() => toggleRoleActive(catalogRole.id)}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition ${
                        assigned.active
                          ? "bg-success-soft text-success"
                          : "bg-surface-muted text-text-subtle"
                      }`}
                    >
                      {assigned.active ? "Activo" : "Desactivado"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {roles.length === 0 && (
            <p className="mt-3 text-xs text-danger">
              El usuario debe tener al menos un rol asignado.
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3 rounded-xl bg-primary-soft p-4 text-xs text-text-muted">
          <Info size={16} className="mt-0.5 shrink-0 text-primary" />
          <p>
            Los cambios de roles se aplican en el siguiente inicio de sesión del
            usuario.
          </p>
        </div>

                <div className="mt-6 flex items-center justify-end gap-4">
          {saved && (
            <span className="mr-auto flex items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-semibold text-white">
              <Check size={16} />
              Cambios guardados
            </span>
          )}

          <Button variant="secondary" onClick={() => router.push("/users")}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={roles.length === 0}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </>
  );
}