"use client";

import TextField from "@/components/forms/text-field";
import { HUILA_MUNICIPALITIES } from "@/config/huila-municipalities";
import {
  COLOMBIA_DEPARTMENTS,
  NO_ZONE_REPORTED_LABEL,
} from "@/config/residence-zones";

type Props = {
  department: string;
  municipality: string;
  municipalityError?: string;
  /** "donde vives actualmente" (adulto) o "donde vive el menor" (tutor). */
  helperText: string;
  onDepartmentChange: (value: string) => void;
  onMunicipalityChange: (value: string) => void;
  onMunicipalityBlur: () => void;
};

/**
 * Departamento + municipio, compartido entre los dos formularios públicos
 * de solicitud. Huila tiene selector real de municipios; el resto de
 * Colombia usa texto libre, porque no existe todavía un catálogo nacional.
 */
export default function ResidenceFields({
  department,
  municipality,
  municipalityError,
  helperText,
  onDepartmentChange,
  onMunicipalityChange,
  onMunicipalityBlur,
}: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm font-medium text-text">
          Zona de residencia (opcional)
        </span>
        <select
          value={department}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">{NO_ZONE_REPORTED_LABEL}</option>
          {COLOMBIA_DEPARTMENTS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="mt-1.5 block text-xs text-text-subtle">
          {helperText}
        </span>
      </label>

      {department === "Huila" ? (
        <label className="block">
          <span className="text-sm font-medium text-text">Municipio</span>
          <select
            value={municipality}
            onChange={(event) => onMunicipalityChange(event.target.value)}
            onBlur={onMunicipalityBlur}
            className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Selecciona</option>
            {HUILA_MUNICIPALITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {municipalityError && (
            <span role="alert" className="mt-1.5 block text-xs text-danger">
              {municipalityError}
            </span>
          )}
        </label>
      ) : (
        department && (
          <TextField
            label="Municipio"
            value={municipality}
            error={municipalityError}
            placeholder="Ej. Bogotá"
            onChange={onMunicipalityChange}
            onBlur={onMunicipalityBlur}
          />
        )
      )}
    </div>
  );
}