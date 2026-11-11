/**
 * Approved legal copy displayed in the application.
 * (DataBase/policies/avisos-casillas.md, FDHF-WEB-AV-01 v1.0).
 * Consent text stored in `policy_documents` is fetched from the backend.
 * This module contains notices and consent controls without a policy type.
 */

export const LEGAL_CONTACT = {
  email: "fun.dejandohuellasfelices@gmail.com",
  phone: "320 972 2813",
  city: "Campoalegre, Huila",
} as const;

/**
 * Defines legal links.
 */
export const LEGAL_LINKS = {
  privacyPolicy: {
    href: "/politica-de-datos",
    label: "Política de Tratamiento de Datos Personales",
  },
  terms: {
    href: "/terminos",
    label: "Términos y condiciones",
  },
} as const;

/** Section 1: general footer notice. */
export const GENERAL_NOTICE = {
  beforeEmail:
    "La Fundación Dejando Huellas Felices (NIT 901391294-3), con domicilio en Calle 29 No. 12 – 50, Campoalegre, Huila, es responsable de los datos personales que recoge en esta página. Los usamos para gestionar citas de atención psicológica, comunicarnos contigo, gestionar donaciones y operar la plataforma. Puedes conocer, actualizar, rectificar o pedir la supresión de tus datos escribiendo a",
  afterEmail: ". Consulta nuestra",
} as const;

/** Section 3: first consent control for dependent requests. */
export const GUARDIAN_DATA_TREATMENT_CONSENT =
  "Soy mayor de edad, soy madre, padre o familiar a cargo del menor para quien pido la cita, y la información que doy es verdadera. Autorizo a la Fundación Dejando Huellas Felices para tratar mis datos personales según la Política de Tratamiento de Datos Personales, que leí y acepto, y para verificar mi parentesco.";

/** Section 4: non-emergency notice. */
export const EMERGENCY_NOTICE = {
  title: "SANA no es un servicio de emergencias.",
  emergencyLine: "123",
  childLine: "141",
} as const;

/** Section 5: consent controls for account-based appointment requests. */
export const ACCOUNT_SELF_REQUEST_CONSENT =
  "Autorizo el tratamiento de mis datos para esta nueva solicitud, según la Política de Tratamiento de Datos Personales.";

/**
 * Defines account dependent request consent.
 */
export const ACCOUNT_DEPENDENT_REQUEST_CONSENT =
  "Como representante del menor, autorizo el tratamiento de mis datos y de sus datos para esta nueva solicitud, según la Política de Tratamiento de Datos Personales.";

/** Section 7: donation notice. */
export const DONATION_NOTICE =
  "Tu pago lo procesa Wompi (Bancolombia). La Fundación no recibe ni guarda los datos de tu tarjeta o cuenta. Guardamos tu nombre, correo, monto y estado de la donación para registrarla y agradecerte. Wompi te envía el comprobante de pago a tu correo. La Fundación no expide certificados de donación para beneficios tributarios.";

/** Section 8: assistant call script. */
export const ASSISTANT_SCRIPT = {
  title: "Guion para leer antes de registrar los datos",
  text: "Le informo que la Fundación Dejando Huellas Felices guardará sus datos en nuestra plataforma para gestionar su cita y enviarle por correo electrónico y WhatsApp la confirmación y los recordatorios de sus citas. Las preguntas sobre motivo de consulta y población vulnerable son opcionales. Puede consultar nuestra Política de Tratamiento de Datos Personales en fundacionhuellitas.vercel.app/politica-de-datos y pedir cambios o la eliminación de sus datos al correo fun.dejandohuellasfelices@gmail.com. ¿Autoriza el tratamiento de sus datos?",
  whatsappNote:
    "Por WhatsApp se envía el mismo texto con el enlace y se guarda la respuesta \"Sí autorizo\" como prueba. Si la persona no autoriza, no se registran sus datos.",
} as const;
