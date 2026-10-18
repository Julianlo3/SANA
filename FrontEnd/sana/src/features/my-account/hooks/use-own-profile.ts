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
  department: string;
  municipality: string;
};

export type ProfileFormErrors = Partial<Record<keyof ProfileFormValues, string>>;

const EMPTY_VALUES: ProfileFormValues = {
  fullName: "",
  phone: "",
  birthdate: "",
  gender: "",
  department: "",
  municipality: "",
};

const GENDERS: readonly string[] = ["F", "M", "O", "P"];

/**
 * Converts a gender value to the expected format.
 * @param value The gender value to convert.
 * @returns The converted gender value.
 */
function toGender(value: string | null): Gender | "" {
  return value !== null && GENDERS.includes(value) ? (value as Gender) : "";
}

/**
 * Splits the residence zone into department and municipality.
 * @param residenceZone The residence zone to split.
 * @returns The department and municipality.
 */
function splitResidenceZone(residenceZone: string | null): {
  department: string;
  municipality: string;
} {
  if (!residenceZone) return { department: "", municipality: "" };

  const separatorIndex = residenceZone.lastIndexOf(",");
  if (separatorIndex < 0) {
    return { department: "", municipality: residenceZone.trim() };
  }

  return {
    municipality: residenceZone.slice(0, separatorIndex).trim(),
    department: residenceZone.slice(separatorIndex + 1).trim(),
  };
}

/**
 * Converts the profile data to form values.
 * @param profile The profile data.
 * @returns The form values.
 */
function toFormValues(profile: OwnProfile): ProfileFormValues {
  return {
    fullName: profile.fullName,
    phone: profile.phone ?? "",
    birthdate: profile.birthdate ? profile.birthdate.slice(0, 10) : "",
    gender: toGender(profile.gender),
    ...splitResidenceZone(profile.residenceZone),
  };
}

/**
 * Hook to get and manage the current user's profile.
 * @returns The profile data and management functions.
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
    };
    if (profile?.canEditConsultantFields) {
      payload.birthdate = values.birthdate || null;
      payload.gender = values.gender || null;
      payload.residenceZone = values.department
        ? values.municipality.trim()
          ? `${values.municipality.trim()}, ${values.department}`
          : null
        : values.municipality.trim() || null;
    }

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
  }, [profile, values]);

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