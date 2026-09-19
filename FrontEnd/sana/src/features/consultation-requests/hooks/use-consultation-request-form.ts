"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { DATA_POLICY } from "@/config/data-policy";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { submitConsultationRequest } from "../services/consultation-requests-service";
import type {
  ConsultationRequestPayload,
  ConsultationRequestReceipt,
  GuardianRelationship,
  RequesterType,
} from "../types/consultation-request-types";
import {
  validateGuardianRequest,
  validateSelfRequest,
  type RequestFormValues,
} from "../validation/consultation-request-validation";

const EMPTY_FORM: RequestFormValues = {
  fullName: "",
  identityDocument: "",
  birthDate: "",
  email: "",
  phone: "",
  relationship: "",
  minorFullName: "",
  minorBirthDate: "",
  residenceZoneId: "",
  consultationReason: "",
  hasAcceptedDataPolicy: false,
};

/**
 * Lógica del formulario público de solicitud (HU-2.2).
 *
 * Un solo hook cubre los dos tipos de solicitante porque comparten
 * la mayoría de los campos. Esto permite conservar los datos de
 * contacto al cambiar de tipo, como pide HU-2.2.9.
 */
export function useConsultationRequestForm(
  requesterType: RequesterType,
) {
  const router = useRouter();

  const form = useForm<RequestFormValues>({
    initialValues: EMPTY_FORM,
    validate:
      requesterType === "guardian"
        ? validateGuardianRequest
        : validateSelfRequest,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] =
    useState<ConsultationRequestReceipt | null>(null);

  const { setValue, submit } = form;

  /**
   * Actualiza el parentesco seleccionado por el tutor.
   */
  const setRelationship = useCallback(
    (relationship: GuardianRelationship | "") => {
      setValue("relationship", relationship);
    },
    [setValue],
  );

  /**
   * Actualiza la autorización para el tratamiento de datos.
   */
  const toggleDataPolicy = useCallback(
    (accepted: boolean) => {
      setValue("hasAcceptedDataPolicy", accepted);
    },
    [setValue],
  );

  /**
   * Construye el payload que espera el backend según
   * el tipo de solicitante.
   */
  const buildPayload = useCallback(
    (
      submitted: RequestFormValues,
    ): ConsultationRequestPayload => {
      const shared = {
        residenceZoneId: submitted.residenceZoneId
          ? Number(submitted.residenceZoneId)
          : null,
        consultationReason:
          submitted.consultationReason.trim(),
        hasAcceptedDataPolicy: true as const,
        dataPolicyVersion: DATA_POLICY.version,
      };

      if (requesterType === "guardian") {
        return {
          requesterType: "guardian",
          guardian: {
            fullName: submitted.fullName.trim(),
            identityDocument:
              submitted.identityDocument.trim(),
            relationship:
              submitted.relationship as GuardianRelationship,
            email: submitted.email.trim().toLowerCase(),
            phone: submitted.phone.trim(),
          },
          minor: {
            fullName: submitted.minorFullName.trim(),
            birthDate: submitted.minorBirthDate,
          },
          ...shared,
        };
      }

      return {
        requesterType: "self",
        fullName: submitted.fullName.trim(),
        identityDocument:
          submitted.identityDocument.trim(),
        birthDate: submitted.birthDate,
        email: submitted.email.trim().toLowerCase(),
        phone: submitted.phone.trim(),
        ...shared,
      };
    },
    [requesterType],
  );

  /**
   * Valida el formulario completo y envía la solicitud.
   *
   * Este método debe utilizarse únicamente en el último paso,
   * cuando el usuario ya completó también la autorización
   * para el tratamiento de datos.
   */
  const send = useCallback(async () => {
    const submitted = submit();

    if (!submitted) {
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    try {
      const payload = buildPayload(submitted);

      const result =
        await submitConsultationRequest(payload);

      setReceipt(result);

      router.push(
        `/solicitar-cita/confirmacion?radicado=${encodeURIComponent(
          result.referenceNumber,
        )}`,
      );
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [submit, buildPayload, router]);

  return {
    ...form,
    setRelationship,
    toggleDataPolicy,
    isSaving,
    submitError,
    receipt,
    send,
  };
}