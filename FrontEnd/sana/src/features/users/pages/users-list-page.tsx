"use client";

import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import PageDecor from "@/components/ui/page-decor";
import UserActionDialog from "../components/user-action-dialog";
import UsersList from "../components/users-list";
import { useUsersList } from "../hooks/use-users-list";

/**
 * Pantalla de gestión de usuarios.
 * Solo compone la interfaz: la lógica vive en use-users-list.
 */
export default function UsersListPage() {
  const {
    users,
    filteredUsers,
    activeCount,
    isLoading,
    isSaving,
    loadError,
    actionError,
    query,
    setQuery,
    openMenuUserId,
    toggleMenu,
    closeMenu,
    pendingAction,
    startAction,
    cancelAction,
    confirmAction,
  } = useUsersList();

  return (
    <>
      <PageDecor variant="users" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl">
              Gestión de usuarios
            </h1>
            <p className="mt-2 max-w-xl text-sm text-text-muted">
              Administra las cuentas y los roles del personal de la fundación.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-border bg-surface px-5 py-3 text-right">
            <p className="text-xs text-text-subtle">Cuentas activas</p>
            <p className="font-display text-3xl font-bold text-primary">
              {activeCount}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={16}
              aria-hidden
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, correo o documento"
              aria-label="Buscar usuarios"
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-11 pr-4 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <Link
            href="/users/new"
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark sm:ml-auto"
          >
            <UserPlus size={16} aria-hidden />
            Crear usuario
          </Link>
        </div>

        {loadError && (
          <div className="mt-6">
            <InlineMessage tone="error">{loadError}</InlineMessage>
          </div>
        )}

        <div className="mt-6">
          {isLoading ? (
            <p className="rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
              Cargando usuarios…
            </p>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface px-5 py-12 text-center">
              <p className="text-sm text-text-muted">
                {users.length === 0
                  ? "Todavía no hay cuentas creadas."
                  : "Ningún usuario coincide con la búsqueda."}
              </p>
              {users.length === 0 && (
                <Link
                  href="/users/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  <UserPlus size={16} aria-hidden />
                  Crear la primera cuenta
                </Link>
              )}
            </div>
          ) : (
            <UsersList
              users={filteredUsers}
              openMenuUserId={openMenuUserId}
              onToggleMenu={toggleMenu}
              onCloseMenu={closeMenu}
              onAction={startAction}
            />
          )}
        </div>

        {!isLoading && filteredUsers.length > 0 && (
          <p className="mt-4 text-xs text-text-subtle">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </p>
        )}

        {pendingAction && pendingAction.action !== "edit" && (
          <UserActionDialog
            action={pendingAction.action}
            user={pendingAction.user}
            isSaving={isSaving}
            error={actionError}
            onConfirm={confirmAction}
            onClose={cancelAction}
          />
        )}
      </div>
    </>
  );
}