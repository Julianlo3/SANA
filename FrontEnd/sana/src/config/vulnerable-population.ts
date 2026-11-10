/**
 * Vulnerable population categories available in the consultation request form.
 *
 * This provisional list is based on categories recognized in Colombia and
 * requires confirmation by the foundation before production use.
 */

export const VULNERABLE_POPULATION_OPTIONS = [
  { value: "conflict_victim", label: "Víctima del conflicto armado" },
  { value: "disability", label: "Persona con discapacidad" },
  { value: "indigenous", label: "Comunidad indígena" },
  {
    value: "afro_descendant",
    label: "Comunidad afrodescendiente, negra, palenquera o raizal",
  },
  { value: "migrant", label: "Población migrante" },
  { value: "elderly", label: "Adulto mayor" },
  { value: "none", label: "Ninguna de las anteriores" },
] as const;

/**
 * Defines the vulnerable population category type.
 */

export type VulnerablePopulationCategory =
  (typeof VULNERABLE_POPULATION_OPTIONS)[number]["value"];