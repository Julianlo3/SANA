"use client";

import { useCallback, useEffect, useState } from "react";
import type { Gender } from "@/features/consultation-requests/types/consultation-request-types";
import {
  validateFullName,
  validatePhone,
} from "@/features/consultation-requests/validation/consultation-request-validation";
import { ApiError } from "@/types/api-types";
import {
  getOwnProfile,
  updateOwnProfile,
} from "../services/my-account-service";
import type {
  OwnProfile,
  UpdateOwnProfilePayload,
} from "../types/my-account-types";

export type ProfileFormValues = {
  fullName: string;
  phone: string;
  birthdate: string;
  gender: Gender | "";
  residenceZone: string;
};

export type ProfileFormErrors = Partial<Record<keyof ProfileFormValues, string>>;

const EMPTY_VALUES: ProfileFormValues = {
  fullName: "",
  phone: "",
  birthdate: "",
  gender: "",
  residenceZone: "",
};

const GENDERS: readonly string[] = ["F", "M", "O", "P"];

function toGender(value: string | null): Gender | "" {
  return value !== null && GENDERS.includes(value) ? (value as Gender) : "";
}

function toFormValues(profile: OwnProfile): ProfileFormValues {
  return {
    fullName: profile.fullName,
    phone: profile.phone ?? "",
    birthdate: profile.birthdate ? profile.birthdate.slice(0, 10) : "",
    gender: toGender(profile.gender),
    residenceZone: profile.residenceZone ?? "",
  };
}

/**
 * Perfil propio del consultante: se ve siempre, y se edita solo si lo
 * habilita. El correo y el documento no se editan: el backend los fija.
 */
export function useOwnProfile() {
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [values, setValues] = useState<ProfileFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [wasSaved, setWasSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getOwnProfile(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setProfile(result);
        setValues(toFormValues(result));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar tu información. Intenta de nuevo.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setWasSaved(false);
    setSaveError(null);
  }, []);

  const cancelEditing = useCallback(() => {
    if (profile) setValues(toFormValues(profile));
    setErrors({});
    setSaveError(null);
    setIsEditing(false);
  }, [profile]);

  const setField = useCallback(
    <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => {
      setValues((current) => ({ ...current, [key]: value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
    },
    [],
  );

  const save = useCallback(async () => {
    const nextErrors: ProfileFormErrors = {
      fullName: validateFullName(values.fullName),
      phone: validatePhone(values.phone),
    };

    if (nextErrors.fullName || nextErrors.phone) {
      setErrors(nextErrors);
      return;
    }

    const payload: UpdateOwnProfilePayload = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      birthdate: values.birthdate || null,
      gender: values.gender || null,
      residenceZone: values.residenceZone.trim() || null,
    };

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateOwnProfile(payload);
      const fresh = await getOwnProfile();
      setProfile(fresh);
      setValues(toFormValues(fresh));
      setIsEditing(false);
      setWasSaved(true);
    } catch (error: unknown) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : "No pudimos guardar los cambios. Intenta de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [values]);

  return {
    profile,
    values,
    errors,
    isLoading,
    loadError,
    isEditing,
    isSaving,
    saveError,
    wasSaved,
    startEditing,
    cancelEditing,
    setField,
    save,
  };
}