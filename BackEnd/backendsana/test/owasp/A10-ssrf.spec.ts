/**
 * OWASP A10:2021 – Server-Side Request Forgery (SSRF)
 * ===================================================
 * Verifica que el servidor no haga peticiones arbitrarias a URLs controladas por el usuario.
 *
 * Referencia: OWASP Top 10
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('OWASP A10 – Server-Side Request Forgery (SSRF)', () => {

  describe('A10.1 – URLs de JWKS parametrizadas desde ConfigService', () => {
    it('Auth0IdentityService DEBE usar configuración interna para la URL del JWKS, no un input de usuario', () => {
      const servicePath = path.resolve(__dirname, '../../src/auth/auth0-identity.service.ts');
      const content = fs.readFileSync(servicePath, 'utf-8');

      // La URL se construye internamente a partir de AUTH0_DOMAIN
      expect(content).toContain("this.configService");
      expect(content).toContain("'AUTH0_DOMAIN'");
      // No debe aceptar dominios desde el request
      expect(content).not.toMatch(/verifyAccessToken\(.*domain: string.*\)/);
    });
  });

  describe('A10.2 – Configuración CORS estricta', () => {
    it('OriginGuard DEBE validar usando orígenes predefinidos, sin hacer fetch/resolución DNS que pueda ser manipulada', () => {
      const guardPath = path.resolve(__dirname, '../../src/guards/origin.guard.ts');
      const content = fs.readFileSync(guardPath, 'utf-8');

      // OriginGuard no hace peticiones HTTP para verificar dominios, solo string matching
      expect(content).not.toContain('fetch(');
      expect(content).not.toContain('axios.');
      expect(content).toContain('.includes(origin)');
    });
  });
});
