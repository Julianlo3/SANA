/**
 * Ubicación de residencia (HU-2.2.5 y HU-2.1.6).
 *
 * El departamento sale del listado oficial del DANE, es una lista estable.
 * El municipio queda como texto libre: un catálogo completo de los más de
 * 1.100 municipios de Colombia no existe todavía en el proyecto: se
 * reemplaza este campo por un selector cuando haya esa fuente de datos.
 */

export const COLOMBIA_DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bogotá D.C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const;

export type ColombiaDepartment = (typeof COLOMBIA_DEPARTMENTS)[number];

/** Departamento donde opera principalmente la fundación, para preseleccionar. */
export const DEFAULT_DEPARTMENT: ColombiaDepartment = "Huila";

/** Texto de la opción cuando la persona prefiere no indicar su zona. */
export const NO_ZONE_REPORTED_LABEL = "No reporta";