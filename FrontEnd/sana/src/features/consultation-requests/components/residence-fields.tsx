"use client";

import { useEffect, useState } from "react";
import TextField from "@/components/forms/text-field";
import { NO_ZONE_REPORTED_LABEL } from "@/config/residence-zones";
import {
  getColombiaCitiesByDepartmentName,
  getColombiaDepartments,
  type ColombiaCity,
  type ColombiaDepartment,
} from "@/services/colombia-service";

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
 * Component to select the residence zone
 * @param param0 props to pass to the component
 * @returns ResidenceFields component
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
  const [departments, setDepartments] = useState<ColombiaDepartment[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  const [municipalities, setMunicipalities] = useState<ColombiaCity[]>([]);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [municipalitiesError, setMunicipalitiesError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingDepartments(true);
    setDepartmentsError(null);

    getColombiaDepartments()
      .then((data) => {
        if (isMounted) {
          setDepartments(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDepartmentsError("No se pudieron cargar los departamentos.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDepartments(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!department) {
      setMunicipalities([]);
      setIsLoadingMunicipalities(false);
      setMunicipalitiesError(null);
      return;
    }

    let isMounted = true;
    setIsLoadingMunicipalities(true);
    setMunicipalitiesError(null);

    getColombiaCitiesByDepartmentName(department)
      .then((data) => {
        if (isMounted) {
          setMunicipalities(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMunicipalitiesError("No se pudieron cargar los municipios.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMunicipalities(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [department]);

  const hasSelectedMunicipalityInList = Boolean(
    municipality &&
    municipalities.some(
      (city) => city.name.toLowerCase() === municipality.toLowerCase(),
    ),
  );

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block">
        <span className="text-sm font-medium text-text">
          Zona de residencia (opcional)
        </span>
        <select
          value={department}
          disabled={isLoadingDepartments && departments.length === 0}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-surface-muted"
        >
          <option value="">
            {isLoadingDepartments
              ? "Cargando departamentos…"
              : NO_ZONE_REPORTED_LABEL}
          </option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
        {departmentsError && (
          <span role="alert" className="mt-1.5 block text-xs text-danger">
            {departmentsError}
          </span>
        )}
        <span className="mt-1.5 block text-xs text-text-subtle">
          {helperText}
        </span>
      </label>

      {department && (
        <div className="block">
          {municipalitiesError ? (
            <div>
              <TextField
                label="Municipio"
                value={municipality}
                error={municipalityError}
                placeholder="Escribe tu municipio"
                onChange={onMunicipalityChange}
                onBlur={onMunicipalityBlur}
              />
              <span className="mt-1 block text-xs text-text-subtle">
                No se pudo conectar con el catálogo de municipios. Puedes
                ingresarlo manualmente.
              </span>
            </div>
          ) : (
            <label className="block">
              <span className="text-sm font-medium text-text">Municipio</span>
              <select
                value={municipality}
                disabled={isLoadingMunicipalities}
                onChange={(event) => onMunicipalityChange(event.target.value)}
                onBlur={onMunicipalityBlur}
                className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-surface-muted"
              >
                <option value="">
                  {isLoadingMunicipalities
                    ? "Cargando municipios…"
                    : "Selecciona"}
                </option>
                {municipality &&
                  !hasSelectedMunicipalityInList &&
                  !isLoadingMunicipalities && (
                    <option value={municipality}>{municipality}</option>
                  )}
                {municipalities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
              {municipalityError && (
                <span
                  role="alert"
                  className="mt-1.5 block text-xs text-danger"
                >
                  {municipalityError}
                </span>
              )}
            </label>
          )}
        </div>
      )}
    </div>
  );
}