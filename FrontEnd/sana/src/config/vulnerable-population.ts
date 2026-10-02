/**
 * Categorías de población vulnerable (HU-2.2, pedido del cliente 30/09).
 *
 * PENDIENTE DE CONFIRMAR CON EL CLIENTE: esta lista se armó con categorías
 * oficiales reconocidas en Colombia (RUV, discapacidad, etnias, adulto
 * mayor, migración), pero el cliente no dio su propia lista en la reunión.
 * Antes de producción, la fundación debe confirmar o ajustar estas
 * opciones — es información sensible y puede que la necesiten alinear con
 * algún reporte que ya hagan a una entidad.
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

export type VulnerablePopulationCategory =
  (typeof VULNERABLE_POPULATION_OPTIONS)[number]["value"];