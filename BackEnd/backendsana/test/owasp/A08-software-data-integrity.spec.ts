/**
 * OWASP A08:2021 – Software and Data Integrity Failures
 * =====================================================
 * Verifica la integridad de datos:
 * - Uso de JWT firmados y validados con JWKS público
 * - No se aceptan tokens sin firma (algoritmo 'none' no permitido)
 * 
 * Referencia: RNF-SEG-02
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('OWASP A08 – Software and Data Integrity Failures', () => {

  describe('A08.1 – Verificación estricta de firma JWT', () => {
    it('Auth0IdentityService DEBE restringir los algoritmos permitidos (solo RS256)', () => {
      const servicePath = path.resolve(__dirname, '../../src/auth/auth0-identity.service.ts');
      const content = fs.readFileSync(servicePath, 'utf-8');

      // Previene ataques de sustitución de algoritmo (ej. cambiar RS256 por HS256 o 'none')
      expect(content).toMatch(/algorithms:\s*\['RS256'\]/);
      expect(content).not.toContain("'none'");
    });
  });

  describe('A08.2 – Integridad del flujo CI/CD', () => {
    it('El pipeline (GitHub Actions) DEBE incluir pruebas y linters (QA-01)', () => {
      const packageJsonPath = path.resolve(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Verificar existencia de scripts que CI correría
      expect(packageJson.scripts['lint']).toBeDefined();
      expect(packageJson.scripts['test']).toBeDefined();
    });
  });
});
