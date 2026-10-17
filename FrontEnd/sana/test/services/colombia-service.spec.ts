import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearColombiaCache,
  getColombiaCities,
  getColombiaCitiesByDepartmentName,
  getColombiaDepartments,
} from '../../src/services/colombia-service';

describe('colombia-service', () => {
  beforeEach(() => {
    clearColombiaCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearColombiaCache();
    vi.restoreAllMocks();
  });

  describe('getColombiaDepartments', () => {
    it('debe obtener la lista de departamentos ordenada alfabéticamente', async () => {
      const mockDepartments = [
        { id: 2, name: 'Valle del Cauca' },
        { id: 1, name: 'Antioquia' },
        { id: 3, name: 'Cundinamarca' },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartments,
      } as Response);

      const result = await getColombiaDepartments();

      expect(result).toHaveLength(3);
      expect(result.map((d) => d.name)).toEqual([
        'Antioquia',
        'Cundinamarca',
        'Valle del Cauca',
      ]);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(globalThis.fetch).toHaveBeenCalledWith('https://api-colombia.com/api/v1/Department');
    });

    it('debe cachear el resultado y no repetir la llamada fetch en invocaciones sucesivas', async () => {
      const mockDepartments = [{ id: 18, name: 'Huila' }];

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockDepartments,
      } as Response);

      const res1 = await getColombiaDepartments();
      const res2 = await getColombiaDepartments();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(res1).toEqual(res2);
    });

    it('debe lanzar error si la respuesta HTTP no es exitosa y permitir reintento', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 1, name: 'Antioquia' }],
        } as Response);

      await expect(getColombiaDepartments()).rejects.toThrow('No se pudieron obtener los departamentos');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Reintento tras fallo
      const retryResult = await getColombiaDepartments();
      expect(retryResult).toHaveLength(1);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('getColombiaCities', () => {
    it('debe obtener los municipios del departamento ordenados alfabéticamente', async () => {
      const mockCities = [
        { id: 10, name: 'Pitalito', departmentId: 18 },
        { id: 11, name: 'Neiva', departmentId: 18 },
        { id: 12, name: 'Garzón', departmentId: 18 },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockCities,
      } as Response);

      const result = await getColombiaCities(18);

      expect(result.map((c) => c.name)).toEqual(['Garzón', 'Neiva', 'Pitalito']);
      expect(globalThis.fetch).toHaveBeenCalledWith('https://api-colombia.com/api/v1/Department/18/cities');
    });

    it('debe cachear las ciudades por cada departamento por separado', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 1, name: 'Neiva', departmentId: 18 }],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 2, name: 'Medellín', departmentId: 2 }],
        } as Response);

      const cities18_1 = await getColombiaCities(18);
      const cities18_2 = await getColombiaCities(18);
      expect(cities18_1).toEqual(cities18_2);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const cities2 = await getColombiaCities(2);
      expect(cities2[0].name).toBe('Medellín');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('getColombiaCitiesByDepartmentName', () => {
    it('debe encontrar el departamento por nombre (case-insensitive) y traer sus municipios', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 18, name: 'Huila' },
            { id: 2, name: 'Antioquia' },
          ],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 657, name: 'Neiva', departmentId: 18 },
          ],
        } as Response);

      const cities = await getColombiaCitiesByDepartmentName('huila');
      expect(cities).toHaveLength(1);
      expect(cities[0].name).toBe('Neiva');
    });

    it('debe retornar lista vacía si el departamento no existe o el nombre está vacío', async () => {
      expect(await getColombiaCitiesByDepartmentName('')).toEqual([]);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 18, name: 'Huila' }],
      } as Response);

      expect(await getColombiaCitiesByDepartmentName('Inexistente')).toEqual([]);
    });
  });
});
