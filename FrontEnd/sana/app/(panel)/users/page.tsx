"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import PageDecor from "@/components/ui/PageDecor";
import UserRow from "@/components/users/UserRow";
import UserActionDialog from "@/components/users/UserActionDialog";
import type { UserAction } from "@/components/users/UserActionsMenu";
import { mockUsers, type User } from "@/lib/mocks/users";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{
    action: UserAction;
    user: User;
  } | null>(null);

  const filtered = users.filter((user) => {
    const text = `${user.fullName} ${user.email}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const activeCount = users.filter((user) => user.status === "active").length;

  function handleAction(action: UserAction, user: User) {
    setOpenMenuId(null);

    if (action === "edit") {
      console.log("Editar", user.fullName);
      return;
    }

    setDialog({ action, user });
  }

  function handleConfirm(action: UserAction, user: User, reason?: string) {
    const newStatus =
      action === "block"
        ? "blocked"
        : action === "deactivate"
          ? "inactive"
          : "active";

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id ? { ...item, status: newStatus } : item,
      ),
    );

    console.log("Confirmado:", action, user.fullName, reason);
    setDialog(null);
  }

  return (
    <>
      <PageDecor variant="users" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-primary-dark">
              Gestión de Usuarios
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text-muted">
              Administra los niveles de acceso y roles operativos del personal
              de la fundación.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-border bg-surface px-5 py-3 text-right">
            <p className="text-xs text-text-subtle">Activos</p>
            <p className="font-display text-3xl font-bold text-primary">
              {activeCount}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrar por nombre o correo..."
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-11 pr-4 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

                    <Link
            href="/users/new"
            className="ml-auto flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            <UserPlus size={16} />
            Crear usuario
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-subtle">
                <th className="py-3 pl-5 pr-3 font-medium">Usuario</th>
                <th className="px-3 py-3 font-medium">Correo</th>
                <th className="px-3 py-3 font-medium">Rol</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-3 py-3 font-medium">Última conexión</th>
                <th className="py-3 pl-3 pr-5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  menuOpen={openMenuId === user.id}
                  onToggleMenu={() =>
                    setOpenMenuId(openMenuId === user.id ? null : user.id)
                  }
                  onCloseMenu={() => setOpenMenuId(null)}
                  onAction={handleAction}
                />
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-text-subtle">
              No se encontraron usuarios con ese criterio.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-text-subtle">
          Mostrando {filtered.length} de {users.length} usuarios
        </p>

        {dialog && (
          <UserActionDialog
            action={dialog.action}
            user={dialog.user}
            onConfirm={handleConfirm}
            onClose={() => setDialog(null)}
          />
        )}
      </div>
    </>
  );
}