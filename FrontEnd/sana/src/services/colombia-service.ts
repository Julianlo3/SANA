/**
 * This service is used to get the departments and municipalities of Colombia
 */
export type ColombiaDepartment = {
  id: number;
  name: string;
  description?: string;
  cityCapitalId?: number;
  municipalities?: number;
  surface?: number;
  population?: number;
  phonePrefix?: string;
  countryId?: number;
};

/**
 * Type for Colombia cities
 */
export type ColombiaCity = {
  id: number;
  name: string;
  description?: string;
  surface?: number | null;
  population?: number | null;
  postalCode?: string | null;
  departmentId: number;
};

const BASE_URL = "https://api-colombia.com/api/v1";

let departmentsPromise: Promise<ColombiaDepartment[]> | null = null;
const citiesPromiseCache = new Map<number, Promise<ColombiaCity[]>>();

/**
 * Gets the list of all departments in Colombia, ordered alphabetically.
 * It uses caching to avoid unnecessary repeated requests.
 */
export async function getColombiaDepartments(): Promise<ColombiaDepartment[]> {
  if (!departmentsPromise) {
    departmentsPromise = fetch(`${BASE_URL}/Department`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Error ${response.status}: No se pudieron obtener los departamentos.`,
          );
        }
        const data: ColombiaDepartment[] = await response.json();
        return data.sort((a, b) => a.name.localeCompare(b.name, "es"));
      })
      .catch((error) => {
        departmentsPromise = null;
        throw error;
      });
  }

  return departmentsPromise;
}

/**
 * Gets the list of municipalities corresponding to a department by its ID.
 * It is cached by departmentId to optimize repeated selections.
 */
export async function getColombiaCities(
  departmentId: number,
): Promise<ColombiaCity[]> {
  if (!citiesPromiseCache.has(departmentId)) {
    const promise = fetch(`${BASE_URL}/Department/${departmentId}/cities`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Error ${response.status}: No se pudieron obtener los municipios.`,
          );
        }
        const data: ColombiaCity[] = await response.json();
        return data.sort((a, b) => a.name.localeCompare(b.name, "es"));
      })
      .catch((error) => {
        citiesPromiseCache.delete(departmentId);
        throw error;
      });

    citiesPromiseCache.set(departmentId, promise);
  }

  return citiesPromiseCache.get(departmentId)!;
}

/**
 * Gets the list of municipalities by searching the department by its name.
 */
export async function getColombiaCitiesByDepartmentName(
  departmentName: string,
): Promise<ColombiaCity[]> {
  const normalizedName = departmentName.trim().toLowerCase();
  if (!normalizedName) return [];

  const departments = await getColombiaDepartments();
  const department = departments.find(
    (dept) => dept.name.trim().toLowerCase() === normalizedName,
  );

  if (!department) return [];

  return getColombiaCities(department.id);
}

/**
 * Clears the in-memory cache.
 */
export function clearColombiaCache(): void {
  departmentsPromise = null;
  citiesPromiseCache.clear();
}
