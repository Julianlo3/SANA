"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import TextField from "@/components/forms/text-field";
import { ApiError } from "@/types/api-types";
import {
  IMAGE_ALLOWED_TYPES,
  IMAGE_ALT_MAX_LENGTH,
  IMAGE_RULES_MESSAGE,
} from "../config/content-sections";
import { uploadImage, validateImageFile } from "../services/image-upload-service";
import type { ImageFolder } from "../types/content-types";

type Props = {
  folder: ImageFolder;
  imageUrl: string | null;
  imageAlt: string;
  onImageChange: (url: string | null) => void;
  onAltChange: (alt: string) => void;
  altError?: string;
  required?: boolean;
  disabled?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
};

export default function ImageUploadField({
  folder,
  imageUrl,
  imageAlt,
  onImageChange,
  onAltChange,
  altError,
  required = false,
  disabled = false,
  onUploadingChange,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);

    const invalid = validateImageFile(file);
    if (invalid) {
      setUploadError(invalid);
      return;
    }

    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      onImageChange(await uploadImage(file, folder));
    } catch (error) {
      setUploadError(
        error instanceof ApiError ? error.message : "No pudimos subir la imagen. Intenta de nuevo.",
      );
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isLocked = disabled || isUploading;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-semibold text-text">
          Imagen
          {required && (
            <span className="text-danger" aria-hidden>
              *
            </span>
          )}
        </label>

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={IMAGE_ALLOWED_TYPES.join(",")}
          className="sr-only"
          disabled={isLocked}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative aspect-[4/3] w-full max-w-56 overflow-hidden rounded-xl border border-dashed border-border bg-surface-muted">
            {imageUrl ? (
              <Image src={imageUrl} alt={imageAlt || ""} fill sizes="224px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-xs text-text-subtle">
                {isUploading ? "Subiendo…" : "Sin imagen"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isLocked}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ImagePlus size={16} aria-hidden />
              {isUploading ? "Subiendo…" : imageUrl ? "Cambiar imagen" : "Subir imagen"}
            </button>
            {imageUrl && !required && (
              <button
                type="button"
                onClick={() => onImageChange(null)}
                disabled={isLocked}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-muted transition hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={16} aria-hidden />
                Quitar
              </button>
            )}
          </div>
        </div>

        <span
          role={uploadError ? "alert" : undefined}
          className={`mt-1.5 block text-xs ${uploadError ? "text-danger" : "text-text-subtle"}`}
        >
          {uploadError ?? IMAGE_RULES_MESSAGE}
        </span>
      </div>

      {imageUrl && (
        <TextField
          label="Descripción de la imagen"
          required
          value={imageAlt}
          error={altError}
          maxLength={IMAGE_ALT_MAX_LENGTH}
          disabled={isLocked}
          hint="Describe lo que se ve. La usan los lectores de pantalla."
          onChange={onAltChange}
        />
      )}
    </div>
  );
}
