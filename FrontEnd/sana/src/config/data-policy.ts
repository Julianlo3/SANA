/**
 * Política de tratamiento de datos personales (HU-2.2.6 y HU-2.2.8).
 *
 * PROVISIONAL: la fundación aún no ha publicado el texto de la política.
 * El sistema debe registrar qué versión aceptó cada persona como evidencia
 * del consentimiento, conforme a la Ley 1581 de 2012.
 *
 * Cuando exista el texto real hay que actualizar la versión y la ruta.
 * Cada cambio del texto obliga a subir la versión.
 */

export const DATA_POLICY = {
  version: "1.0",
  url: "/politica-de-datos",
  consentLabel:
    "Autorizo el tratamiento de mis datos personales conforme a la Política de Privacidad de la Fundación Dejando Huellas Felices, para fines de contacto y gestión de la consulta.",
  linkLabel: "Ver política de tratamiento de datos",
} as const;