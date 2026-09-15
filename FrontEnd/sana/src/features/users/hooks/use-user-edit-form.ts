"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { requiresProfessionalData } from "@/config/roles";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { getUserById, updateUser } from "../services/users-service";
import type { AssignedRole, UpdateUserPayload, User } from "../types/user-types";
import {
  validateUserEditForm,
  type UserFormValues,
} from "../validation/user-validation";

export type EditableFormValues = UserFormValues & {
  /** Roles asignados que están temporalmente apagados. */
  inactiveRoleIds: number[];
};

const EMPTY_VALUES: EditableFormValues = {
  fullName: "",
  identityDocument: "",
  email: "",
  contactNumber: "",
  roleIds: [],
  inactiveRoleIds: [],
  licenseNumber: "",
  speciality: "",
};

/** Nombre en español de cada campo, para el resumen de cambios. */
const FIELD_LABELS: Record<string, string> = {
  fullName: "Nombre completo",
  contactNumber: "Número de contacto",
  roleIds: "Roles asignados",
  inactiveRoleIds: "Roles activos",
  licenseNumber: "Número de licencia",
  speciality: "Especialidad",
};

function toFormValues(user: User): EditableFormValues {
  return {
    fullName: user.fullName,
    identityDocument: user.identityDocument,
    email: user.email,
    contactNumber: user.contactNumber,
    roleIds: user.roles.map((role) => role.id),
    inactiveRoleIds: user.roles
      .filter((role) => !role.isActive)
      .map((role) => role.id),
    licenseNumber: user.professionalData?.licenseNumber ?? "",
    speciality: user.professionalData?.speciality ?? "",
  };
}

/**
 * Lógica de la edición.
 *
 * Los campos arrancan bloqueados: la persona debe confirmar de forma explícita
 * que va a cambiar la información antes de poder escribir. Así se evita la
 * modificación accidental de una cuenta que solo se entró a consultar.
 */
export function useUserEditForm(userId: number) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wasSaved, setWasSaved] = useState(false);

  const initialValues = useMemo(
    () => (user ? toFormValues(user) : EMPTY_VALUES),
    [user],
  );

  const form = useForm<EditableFormValues>({
    initialValues,
    validate: validateUserEditForm,
  });

  const { reset, values, setValue, submit, changedFields } = form;

  useEffect(() => {
    const controller = new AbortController();

    getUserById(userId, controller.signal)
      .then((found) => {
        if (controller.signal.aborted) return;
        setUser(found);
        if (found) reset(toFormValues(found));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar la información del usuario.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [userId, reset]);

  const toggleEditing = useCallback(
    (enabled: boolean) => {
      setIsEditingEnabled(enabled);
      setWasSaved(false);
      setSubmitError(null);
      // Al desmarcar se devuelve todo a como estaba: nada queda a medias.
      if (!enabled) reset(initialValues);
    },
    [initialValues, reset],
  );

  const toggleRole = useCallback(
    (roleId: number) => {
      const isAssigned = values.roleIds.includes(roleId);

      setValue(
        "roleIds",
        isAssigned
          ? values.roleIds.filter((id) => id !== roleId)
          : [...values.roleIds, roleId],
      );

      if (isAssigned) {
        setValue(
          "inactiveRoleIds",
          values.inactiveRoleIds.filter((id) => id !== roleId),
        );
      }

      setWasSaved(false);
    },
    [values.roleIds, values.inactiveRoleIds, setValue],
  );

  const toggleRoleActive = useCallback(
    (roleId: number) => {
      const isInactive = values.inactiveRoleIds.includes(roleId);

      setValue(
        "inactiveRoleIds",
        isInactive
          ? values.inactiveRoleIds.filter((id) => id !== roleId)
          : [...values.inactiveRoleIds, roleId],
      );

      setWasSaved(false);
    },
    [values.inactiveRoleIds, setValue],
  );

  const needsProfessionalData = requiresProfessionalData(values.roleIds);

  const changedFieldLabels = useMemo(
    () =>
      changedFields
        .map((field) => FIELD_LABELS[field as string])
        .filter(Boolean),
    [changedFields],
  );

  const save = useCallback(async () => {
    if (!user) return;

    const submitted = submit();
    if (!submitted) return;

    if (changedFields.length === 0) {
      setSubmitError("No cambiaste ningún dato todavía.");
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    // Solo viaja lo que efectivamente cambió.
    const payload: UpdateUserPayload = {};
    const changed = new Set(changedFields as string[]);

    if (changed.has("fullName")) payload.fullName = submitted.fullName.trim();
    if (changed.has("contactNumber")) {
      payload.contactNumber = submitted.contactNumber.trim();
    }
    if (changed.has("roleIds") || changed.has("inactiveRoleIds")) {
      payload.roles = submitted.roleIds.map<AssignedRole>((id) => ({
        id,
        isActive: !submitted.inactiveRoleIds.includes(id),
      }));
    }
    if (
      needsProfessionalData &&
      (changed.has("licenseNumber") || changed.has("speciality"))
    ) {
      payload.professionalData = {
        licenseNumber: submitted.licenseNumber.trim(),
        speciality: submitted.speciality.trim(),
      };
    }

    try {
      await updateUser(user.id, payload);

      const updated: User = {
        ...user,
        fullName: submitted.fullName.trim(),
        contactNumber: submitted.contactNumber.trim(),
        roles: submitted.roleIds.map((id) => ({
          id,
          isActive: !submitted.inactiveRoleIds.includes(id),
        })),
        professionalData: needsProfessionalData
          ? {
              licenseNumber: submitted.licenseNumber.trim(),
              speciality: submitted.speciality.trim(),
            }
          : undefined,
      };

      setUser(updated);
      reset(toFormValues(updated));
      setIsEditingEnabled(false);
      setWasSaved(true);
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No pudimos guardar los cambios.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [submit, changedFields, needsProfessionalData, reset, user]);

  return {
    ...form,
    user,
    isLoading,
    loadError,
    isEditingEnabled,
    toggleEditing,
    toggleRole,
    toggleRoleActive,
    needsProfessionalData,
    changedFieldLabels,
    isSaving,
    submitError,
    wasSaved,
    save,
    cancel: () => router.push("/users"),
  };
}