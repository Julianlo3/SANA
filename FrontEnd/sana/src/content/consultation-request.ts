import { DATA_POLICY } from "@/config/data-policy";

/**
 * Textos del flujo público de solicitud de cita (HU-2.2).
 * Separados de los componentes para que se puedan ajustar sin tocar código.
 */

export const REQUEST_CONTENT = {
  typeSelection: {
    eyebrow: "Proceso de admisión",
    title: "Solicitud de primera cita",
    description:
      "Para brindarte la mejor atención, necesitamos saber quién recibirá el acompañamiento psicológico.",
    options: {
      self: {
        title: "Solicito para mí",
        description:
          "Soy mayor de edad y busco acompañamiento psicológico personal.",
      },
      guardian: {
        title: "Soy tutor legal",
        description:
          "Solicito atención para un menor de edad o persona bajo mi tutela legal.",
      },
    },
    confidentialityNote:
      "La Fundación Dejando Huellas Felices garantiza la confidencialidad de todos los datos proporcionados.",
  },

  selfForm: {
    eyebrow: "Atención individual",
    title: "Solicitar cita",
    description:
      "Completa la siguiente información para iniciar tu proceso. Garantizamos total confidencialidad.",
    sections: {
      personal: "Datos personales",
      contact: "Contacto",
      detail: "Detalle",
    },
    fields: {
      fullName: "Nombre completo",
      identityDocument: "Número de identificación",
      birthDate: "Fecha de nacimiento",
      email: "Correo electrónico",
      phone: "Teléfono de contacto",
      residenceZone: "Zona de residencia",
      consultationReason: "Motivo de consulta",
    },
    reasonHint:
      "Opcional. Si lo deseas, cuéntanos brevemente el motivo de tu solicitud.",
    submit: "Enviar solicitud",
    cancel: "Cancelar",
  },

  guardianForm: {
    eyebrow: "Solicitud para menores",
    title: "Nueva consulta",
    description:
      "Estás iniciando el proceso para solicitar una cita psicológica para un menor de edad. Como tutor legal, necesitamos validar tu identidad antes de continuar.",
    steps: ["Identificación", "Detalle y autorización"],
    sections: {
      guardian: "Datos del tutor legal",
      minor: "Datos del menor",
      detail: "Detalle y autorización",
    },
    fields: {
      fullName: "Nombre completo",
      identityDocument: "Documento de identidad",
      relationship: "Parentesco con el menor",
      email: "Correo electrónico",
      phone: "Teléfono de contacto",
      minorFullName: "Nombre del menor",
      minorBirthDate: "Fecha de nacimiento del menor",
      residenceZone: "Zona de residencia",
      consultationReason: "Motivo de consulta",
    },
    privacyNote:
      "Los datos proporcionados están protegidos por el secreto profesional y las normativas vigentes de protección de datos.",
    nextStep: "Siguiente paso",
    previousStep: "Paso anterior",
    submit: "Enviar solicitud",
  },

  dataPolicy: {
    label: DATA_POLICY.consentLabel,
    linkLabel: DATA_POLICY.linkLabel,
    url: DATA_POLICY.url,
  },

      success: {
    title: "Solicitud enviada con éxito",
    description:
      "Registramos tu solicitud correctamente. Una asistente administrativa se pondrá en contacto contigo para confirmar tu cita.",
    confirmedTitle: "¡Tu cita quedó confirmada!",
    confirmedDescriptionPrefix: "Te esperamos el",
    confirmedDescriptionSuffix:
      ". Te enviamos los detalles por correo y WhatsApp.",
    referenceLabel: "Número de radicado",
    referenceHint: "Guarda este número para futuras referencias.",
    backHome: "Volver al inicio",
  },
} as const;