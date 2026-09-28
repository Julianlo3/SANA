"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { submitConsultationRequest } from "../services/consultation-requests-service";
import type {
  AppointmentMode,
  CardType,
  ConsultationRequestPayload,
  Gender,
  GuardianRelationshipId,
  PatientType,
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
  appType: "",
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
 * Alineado al DTO real del backend (CreateAppointmentDto): el payload es
 * plano, no anidado en guardian/minor, y el género va en una letra.
 *
 * Departamento y municipio siguen en el formulario, pero NO se envían
 * todavía: el DTO no tiene esos campos hasta que el backend los agregue.
 * Se activan cuando confirmen los nombres exactos (ver buildPayload).
 *
 * Decisión de equipo: no se ofrece reserva de horario real. La persona puede
 * indicar una fecha preferida, opcional, que la asistente usa como
 * referencia al asignar la cita desde su bandeja (HU-2.3).
 */
export function useConsultationRequestForm(patientType: PatientType) {
  const router = useRouter();

  const form = useForm<RequestFormValues>({
    initialValues: EMPTY_FORM,
    validate:
      patientType === "dependent" ? validateGuardianRequest : validateSelfRequest,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [preferredDate, setPreferredDate] = useState<string | null>(null);

  const { values, setValue, submit } = form;

  const setRelationship = useCallback(
    (relationship: GuardianRelationshipId | "") => {
      setValue("relationship", relationship);
    },
    [setValue],
  );

  const setDocumentType = useCallback(
    (documentType: CardType | "") => {
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

  const setAppointmentMode = useCallback(
    (appType: AppointmentMode | "") => {
      setValue("appType", appType);
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

  const buildPayload = useCallback(
    (submitted: RequestFormValues): ConsultationRequestPayload => {
      // TODO: cuando Brayan confirme los nombres de campo para departamento
      // y municipio en CreateAppointmentDto, agregarlos aquí. Hasta
      // entonces no se envían, aunque el formulario los pida.

      if (patientType === "dependent") {
        return {
          patientType: "dependent",
          requesterName: submitted.fullName.trim(),
          requesterCardType: submitted.documentType as CardType,
          requesterIdentityDocument: submitted.identityDocument.trim(),
          requesterContactNumber: submitted.phone.trim(),
          requesterEmail: submitted.email.trim().toLowerCase(),
          requesterBirthdate: submitted.birthDate,
          requesterGender: submitted.gender as Gender,
          requesterTermsAccepted: true,
          dependentName: submitted.minorFullName.trim(),
          dependentIdentityDocument: submitted.minorIdentityDocument.trim(),
          dependentBirthdate: submitted.minorBirthDate,
          dependentGender: submitted.minorGender as Gender,
          dependentContactNumber: submitted.phone.trim(),
          relationshipId: submitted.relationship as GuardianRelationshipId,
          dependentTermsAccepted: true,
          appType: submitted.appType as AppointmentMode,
          appReason: submitted.consultationReason.trim(),
          appDateIdeal: preferredDate,
        };
      }

      return {
        patientType: "self",
        requesterName: submitted.fullName.trim(),
        requesterCardType: submitted.documentType as CardType,
        requesterIdentityDocument: submitted.identityDocument.trim(),
        requesterContactNumber: submitted.phone.trim(),
        requesterEmail: submitted.email.trim().toLowerCase(),
        requesterBirthdate: submitted.birthDate,
        requesterGender: submitted.gender as Gender,
        requesterTermsAccepted: true,
        appType: submitted.appType as AppointmentMode,
        appReason: submitted.consultationReason.trim(),
        appDateIdeal: preferredDate,
      };
    },
    [patientType, preferredDate],
  );

  const send = useCallback(async () => {
    const submitted = submit();
    if (!submitted) return;

    setIsSaving(true);
    setSubmitError(null);

    try {
      const result = await submitConsultationRequest(buildPayload(submitted));

      const params = new URLSearchParams({
        radicado: String(result.appId),
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
    setAppointmentMode,
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