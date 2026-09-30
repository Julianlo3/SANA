import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import { ApiError } from "@/types/api-types";
import {
  IMAGE_ALLOWED_TYPES,
  IMAGE_MAX_BYTES,
  IMAGE_RULES_MESSAGE,
} from "../config/content-sections";
import type { ImageFolder, ImageUploadSignature } from "../types/content-types";

/** Returns an error message when the file cannot be uploaded, or null when it is valid. */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_ALLOWED_TYPES.includes(file.type) || file.size > IMAGE_MAX_BYTES) {
    return IMAGE_RULES_MESSAGE;
  }
  return null;
}

/** Uploads the file straight to Cloudinary with a signature issued by the backend. */
export async function uploadImage(file: File, folder: ImageFolder): Promise<string> {
  const signature = await httpClient.post<ImageUploadSignature>(
    ENDPOINTS.imageUploadSignatures,
    { folder },
  );

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signature.apiKey);
  form.append("timestamp", String(signature.timestamp));
  form.append("signature", signature.signature);
  form.append("folder", signature.folder);
  form.append("allowed_formats", signature.allowedFormats);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    { method: "POST", body: form },
  ).catch(() => null);

  if (!response?.ok) {
    throw new ApiError(
      response?.status === 400
        ? IMAGE_RULES_MESSAGE
        : "No pudimos subir la imagen. Intenta de nuevo.",
      response?.status ?? 0,
    );
  }

  const uploaded = (await response.json()) as { secure_url: string };
  return uploaded.secure_url;
}
