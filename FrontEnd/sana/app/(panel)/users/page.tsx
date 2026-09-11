"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import UserRow from "@/components/users/UserRow";
import { mockUsers, type User } from "@/lib/mocks/users";

export default function UsersPage() {
  const [users] = useState<User[]>(mockUsers);
  const [query, setQuery] = useState("");

  const filtered = users.filter((user) => {
    const text = `${user.fullName} ${user.email}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const activeCount = users.filter((u) => u.status === "active").length;

  function handleAction(user: User) {
    console.log("Acciones para", user.fullName);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl text-text">
            Gestión de Usuarios
          </h1>
          <p className="mt-2 max-w-xl text-sm text-text-muted">
            Administra los niveles de acceso y roles operativos del personal de
            la fundación.
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-surface px-5 py-3 text-right">
          <p className="text-xs text-text-subtle">Activos</p>
          <p className="font-display text-3xl text-text">{activeCount}</p>
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
            className="w-full rounded-full bg-surface py-2.5 pl-11 pr-4 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <button className="ml-auto flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background transition hover:brightness-110">
          <UserPlus size={16} />
          Invitar usuario
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-text-subtle">
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
              <UserRow key={user.id} user={user} onAction={handleAction} />
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
    </div>
  );
}