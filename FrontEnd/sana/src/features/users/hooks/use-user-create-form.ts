"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { requiresProfessionalData } from "@/config/roles";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { createUser } from "../services/users-service";
import {
  validateUserForm,
  type UserFormValues,
} from "../validation/user-validation";

const EMPTY_FORM: UserFormValues = {
  fullName: "",
  identityDocument: "",
  email: "",
  contactNumber: "",
  roleIds: [],
  licenseNumber: "",
  speciality: "",
};

/** Lógica del formulario de creación. La pantalla solo pinta lo que devuelve. */
export function useUserCreateForm() {
  const router = useRouter();
  const form = useForm<UserFormValues>({
    initialValues: EMPTY_FORM,
    validate: validateUserForm,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { values, setValue, submit } = form;

  const toggleRole = useCallback(
    (roleId: number) => {
      const current = values.roleIds;
      setValue(
        "roleIds",
        current.includes(roleId) ? [] : [roleId],
      );
    },
    [values.roleIds, setValue],
  );

  const needsProfessionalData = requiresProfessionalData(values.roleIds);

  const save = useCallback(async () => {
    const submitted = submit();
    if (!submitted) return;

    setIsSaving(true);
    setSubmitError(null);

    try {
      await createUser({
        fullName: submitted.fullName.trim(),
        identityDocument: submitted.identityDocument.trim(),
        email: submitted.email.trim().toLowerCase(),
        contactNumber: submitted.contactNumber.trim(),
        roleIds: submitted.roleIds,
        professionalData: needsProfessionalData
          ? {
              licenseNumber: submitted.licenseNumber.trim(),
              speciality: submitted.speciality.trim(),
            }
          : undefined,
      });

      router.push("/users");
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No pudimos crear la cuenta.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [submit, needsProfessionalData, router]);

  return {
    ...form,
    toggleRole,
    needsProfessionalData,
    isSaving,
    submitError,
    save,
    cancel: () => router.push("/users"),
  };
}