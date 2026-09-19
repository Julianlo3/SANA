/**
 * Catálogo de zonas de residencia (HU-2.2.5 y HU-2.1.6).
 *
 * PROVISIONAL: la fundación aún no ha entregado su lista oficial de
 * municipios y zonas de atención. Este archivo es un marcador para poder
 * construir los formularios; se reemplaza cuando llegue la lista real, o se
 * elimina si se decide traerla del backend con GET /residence-zones.
 */

export type ResidenceZoneOption = {
  id: number;
  municipality: string;
  zone: string;
};

export const RESIDENCE_ZONES: ResidenceZoneOption[] = [
  { id: 1, municipality: "Neiva", zone: "Comuna 1" },
  { id: 2, municipality: "Neiva", zone: "Comuna 2" },
  { id: 3, municipality: "Neiva", zone: "Comuna 3" },
  { id: 4, municipality: "Neiva", zone: "Comuna 4" },
  { id: 5, municipality: "Neiva", zone: "Comuna 5" },
  { id: 6, municipality: "Neiva", zone: "Comuna 6" },
  { id: 7, municipality: "Neiva", zone: "Comuna 7" },
  { id: 8, municipality: "Neiva", zone: "Comuna 8" },
  { id: 9, municipality: "Neiva", zone: "Comuna 9" },
  { id: 10, municipality: "Neiva", zone: "Comuna 10" },
  { id: 11, municipality: "Neiva", zone: "Zona rural" },
  { id: 12, municipality: "Pitalito", zone: "Casco urbano" },
  { id: 13, municipality: "Garzón", zone: "Casco urbano" },
  { id: 14, municipality: "La Plata", zone: "Casco urbano" },
  { id: 15, municipality: "Campoalegre", zone: "Casco urbano" },
  { id: 16, municipality: "Rivera", zone: "Casco urbano" },
  { id: 17, municipality: "Palermo", zone: "Casco urbano" },
  { id: 18, municipality: "Gigante", zone: "Casco urbano" },
];

/** Texto de la opción cuando la persona prefiere no indicar su zona. */
export const NO_ZONE_REPORTED_LABEL = "No reporta";

export function formatZone(zone: ResidenceZoneOption): string {
  return `${zone.municipality} — ${zone.zone}`;
}