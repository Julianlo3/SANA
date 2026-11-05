"use client";

import TextField from "@/components/forms/text-field";
import { keepDigits } from "@/lib/format/text";
import type { Gender } from "../types/consultation-request-types";
import { calculateAge } from "../validation/consultation-request-validation";
import ValidatedDateField from "./validated-date-field";
import ValidatedSelectField from "./validated-select-field";

/**
 * Props for the DependentPersonFields component, which renders a form for entering information about a dependent person.
 */
type Props = {
  readonly fullName: string;
  readonly birthdate: string;
  readonly gender: Gender | "";
  readonly identityDocument: string;
  readonly confirmIdentityDocument: string;
  readonly errors: {
    readonly fullName?: string;
    readonly birthdate?: string;
    readonly gender?: string;
    readonly identityDocument?: string;
    readonly confirmIdentityDocument?: string;
  };
  readonly onFullNameChange: (value: string) => void;
  readonly onBirthdateChange: (value: string) => void;
  readonly onGenderChange: (value: Gender | "") => void;
  readonly onIdentityDocumentChange: (value: string) => void;
  readonly onConfirmIdentityDocumentChange: (value: string) => void;
  readonly onFullNameBlur?: () => void;
  readonly onBirthdateBlur?: () => void;
  readonly onGenderBlur?: () => void;
  readonly onIdentityDocumentBlur?: () => void;
  readonly onConfirmIdentityDocumentBlur?: () => void;
  readonly nameLabel?: string;
  readonly birthdateLabel?: string;
  readonly genderLabel?: string;
  readonly identityDocumentLabel?: string;
  readonly confirmIdentityDocumentLabel?: string;
  readonly identityDocumentHint?: string;
  readonly identityDocumentPlaceholder?: string;
  readonly layout?: "grid" | "stacked";
};

/**
 * Options for the gender select field, including value and label pairs.
 */
const GENDER_OPTIONS = [
  { value: "M", label: "Hombre" },
  { value: "F", label: "Mujer" },
  { value: "O", label: "Otro" },
  { value: "P", label: "No quiero especificar" },
] as const;

/**
 * Renders a form for entering information about a dependent person, including full name, birthdate, gender, and identity document. It supports validation and error handling for each field.
 * @param param0 Props for the DependentPersonFields component
 * @returns A React component that renders a form for entering information about a dependent person, with validation and error handling for each field.
 */
export default function DependentPersonFields({
  fullName,
  birthdate,
  gender,
  identityDocument,
  confirmIdentityDocument,
  errors,
  onFullNameChange,
  onBirthdateChange,
  onGenderChange,
  onIdentityDocumentChange,
  onConfirmIdentityDocumentChange,
  onFullNameBlur,
  onBirthdateBlur,
  onGenderBlur,
  onIdentityDocumentBlur,
  onConfirmIdentityDocumentBlur,
  nameLabel = "Nombre completo",
  birthdateLabel = "Fecha de nacimiento",
  genderLabel = "Género del menor",
  identityDocumentLabel,
  confirmIdentityDocumentLabel = "Confirma el documento del menor",
  identityDocumentHint,
  identityDocumentPlaceholder = "Solo números",
  layout = "grid",
}: Props) {
  const fieldGroupClass =
    layout === "grid" ? "grid gap-5 sm:grid-cols-2" : "space-y-4";
  const documentLabel =
    identityDocumentLabel ??
    (birthdate && calculateAge(birthdate) >= 7
      ? "Tarjeta de identidad"
      : "Registro civil de nacimiento (NUIP)");

  return (
    <>
      <div className={fieldGroupClass}>
        <TextField
          label={nameLabel}
          required
          value={fullName}
          error={errors.fullName}
          maxLength={100}
          onChange={onFullNameChange}
          onBlur={onFullNameBlur}
        />
        <ValidatedDateField
          label={birthdateLabel}
          value={birthdate}
          max={new Date().toISOString().split("T")[0]}
          error={errors.birthdate}
          onChange={onBirthdateChange}
          onBlur={onBirthdateBlur}
        />
      </div>
      <div className={fieldGroupClass}>
        <ValidatedSelectField
          label={genderLabel}
          value={gender}
          options={GENDER_OPTIONS}
          error={errors.gender}
          onChange={(value) => onGenderChange(value as Gender | "")}
          onBlur={onGenderBlur}
        />
        <TextField
          label={documentLabel}
          required
          value={identityDocument}
          error={errors.identityDocument}
          hint={identityDocumentHint}
          placeholder={identityDocumentPlaceholder}
          inputMode="numeric"
          maxLength={12}
          onChange={(value) => onIdentityDocumentChange(keepDigits(value))}
          onBlur={onIdentityDocumentBlur}
        />
      </div>
      <TextField
        label={confirmIdentityDocumentLabel}
        required
        inputMode="numeric"
        value={confirmIdentityDocument}
        error={errors.confirmIdentityDocument}
        maxLength={12}
        placeholder="Escríbelo de nuevo"
        hint="Por seguridad, escríbelo manualmente; no se permite pegar."
        preventPaste
        onChange={(value) =>
          onConfirmIdentityDocumentChange(keepDigits(value))
        }
        onBlur={onConfirmIdentityDocumentBlur}
      />
    </>
  );
}
