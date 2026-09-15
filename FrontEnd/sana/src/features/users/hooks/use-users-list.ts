"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/types/api-types";
import {
  changeUserStatus,
  deleteUser,
  getUsers,
} from "../services/users-service";
import type { User, UserAction, UserStatus } from "../types/user-types";

const STATUS_BY_ACTION: Partial<Record<UserAction, UserStatus>> = {
  block: "blocked",
  deactivate: "inactive",
  reactivate: "active",
};

/** Toda la lógica del listado: carga, búsqueda, menús y acciones. */
export function useUsersList() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    action: UserAction;
    user: User;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getUsers(controller.signal)
      .then(setUsers)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar los usuarios.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      `${user.fullName} ${user.email} ${user.identityDocument}`
        .toLowerCase()
        .includes(term),
    );
  }, [users, query]);

  const activeCount = useMemo(
    () => users.filter((user) => user.status === "active").length,
    [users],
  );

  const toggleMenu = useCallback((userId: number) => {
    setOpenMenuUserId((current) => (current === userId ? null : userId));
  }, []);

  const closeMenu = useCallback(() => setOpenMenuUserId(null), []);

  const startAction = useCallback(
    (action: UserAction, user: User) => {
      setOpenMenuUserId(null);
      setActionError(null);

      if (action === "edit") {
        router.push(`/users/${user.id}/edit`);
        return;
      }

      setPendingAction({ action, user });
    },
    [router],
  );

  const cancelAction = useCallback(() => setPendingAction(null), []);

  const confirmAction = useCallback(
    async (reason?: string) => {
      if (!pendingAction) return;

      const { action, user } = pendingAction;
      setIsSaving(true);
      setActionError(null);

      try {
        if (action === "delete") {
          await deleteUser(user.id);
          setUsers((current) => current.filter((item) => item.id !== user.id));
        } else {
          const status = STATUS_BY_ACTION[action];
          if (!status) return;

          await changeUserStatus(user.id, status, reason);
          setUsers((current) =>
            current.map((item) =>
              item.id === user.id ? { ...item, status } : item,
            ),
          );
        }

        setPendingAction(null);
      } catch (error: unknown) {
        setActionError(
          error instanceof ApiError
            ? error.message
            : "No pudimos completar la acción.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [pendingAction],
  );

  return {
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
  };
}