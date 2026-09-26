"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { DATA_POLICY } from "@/config/data-policy";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { submitConsultationRequest } from "../services/consultation-requests-service";
import type {
  AdultDocumentType,
  ConsultationRequestPayload,
  Gender,
  GuardianRelationship,
  RequesterType,
  ResidenceLocation,
} from "../types/consultation-request-types";
import {
  validateGuardianRequest,
  validateSelfRequest,
  type RequestFormValues,
} from "../validation/consultation-request-validation";

const EMPTY_FORM: RequestFormValues = {
  fullName: "",
  documentType: "",
  identityDocument: "",
  birthDate: "",
  gender: "",
  email: "",
  phone: "",
  relationship: "",
  minorFullName: "",
  minorBirthDate: "",
  minorGender: "",
  minorIdentityDocument: "",
  department: "",
  municipality: "",
  consultationReason: "",
  hasAcceptedDataPolicy: false,
  hasAcceptedGuardianDataPolicy: false,
  hasAcceptedMinorDataPolicy: false,
};

/**
 * Lógica del formulario público de solicitud (HU-2.2).
 *
 * Un solo hook cubre los dos tipos de solicitante porque comparten la mayoría
 * de los campos. Eso permite conservar los datos de contacto al cambiar de
 * tipo, como pide HU-2.2.9.
 *
 * Decisión de equipo: no se ofrece reserva de horario real. La persona puede
 * indicar una fecha preferida, opcional, que la asistente usa como
 * referencia al asignar la cita desde su bandeja (HU-2.3).
 */
export function useConsultationRequestForm(requesterType: RequesterType) {
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
  const [preferredDate, setPreferredDate] = useState<string | null>(null);

  const { values, setValue, submit } = form;

  const setRelationship = useCallback(
    (relationship: GuardianRelationship | "") => {
      setValue("relationship", relationship);
    },
    [setValue],
  );

  const setDocumentType = useCallback(
    (documentType: AdultDocumentType | "") => {
      setValue("documentType", documentType);
    },
    [setValue],
  );

  const setGender = useCallback(
    (gender: Gender | "") => {
      setValue("gender", gender);
    },
    [setValue],
  );

  const setMinorGender = useCallback(
    (gender: Gender | "") => {
      setValue("minorGender", gender);
    },
    [setValue],
  );

  const toggleDataPolicy = useCallback(
    (accepted: boolean) => {
      setValue("hasAcceptedDataPolicy", accepted);
    },
    [setValue],
  );

  const toggleGuardianDataPolicy = useCallback(
    (accepted: boolean) => {
      setValue("hasAcceptedGuardianDataPolicy", accepted);
    },
    [setValue],
  );

  const toggleMinorDataPolicy = useCallback(
    (accepted: boolean) => {
      setValue("hasAcceptedMinorDataPolicy", accepted);
    },
    [setValue],
  );

  function buildResidence(
    department: string,
    municipality: string,
  ): ResidenceLocation | null {
    if (!department || !municipality.trim()) return null;
    return { department, municipality: municipality.trim() };
  }

  const buildPayload = useCallback(
    (submitted: RequestFormValues): ConsultationRequestPayload => {
      const residence = buildResidence(
        submitted.department,
        submitted.municipality,
      );

      const shared = {
        residence,
        consultationReason: submitted.consultationReason.trim(),
        dataPolicyVersion: DATA_POLICY.version,
        preferredDate,
      };

      if (requesterType === "guardian") {
        return {
          requesterType: "guardian",
          guardian: {
            fullName: submitted.fullName.trim(),
            identityDocument: submitted.identityDocument.trim(),
            relationship: submitted.relationship as GuardianRelationship,
            email: submitted.email.trim().toLowerCase(),
            phone: submitted.phone.trim(),
          },
          minor: {
            fullName: submitted.minorFullName.trim(),
            birthDate: submitted.minorBirthDate,
            gender: submitted.minorGender as Gender,
            identityDocument: submitted.minorIdentityDocument.trim() || null,
          },
          hasAcceptedGuardianDataPolicy: true,
          hasAcceptedMinorDataPolicy: true,
          ...shared,
        };
      }

      return {
        requesterType: "self",
        fullName: submitted.fullName.trim(),
        documentType: submitted.documentType as AdultDocumentType,
        identityDocument: submitted.identityDocument.trim(),
        birthDate: submitted.birthDate,
        gender: submitted.gender as Gender,
        email: submitted.email.trim().toLowerCase(),
        phone: submitted.phone.trim(),
        hasAcceptedDataPolicy: true,
        ...shared,
      };
    },
    [requesterType, preferredDate],
  );

  const send = useCallback(async () => {
    const submitted = submit();
    if (!submitted) return;

    setIsSaving(true);
    setSubmitError(null);

    try {
      const result = await submitConsultationRequest(buildPayload(submitted));

      const params = new URLSearchParams({
        radicado: result.referenceNumber,
      });

      router.push(`/solicitar-cita/confirmacion?${params.toString()}`);
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
    setDocumentType,
    setGender,
    setMinorGender,
    toggleDataPolicy,
    toggleGuardianDataPolicy,
    toggleMinorDataPolicy,
    isSaving,
    submitError,
    preferredDate,
    setPreferredDate,
    send,
  };
}