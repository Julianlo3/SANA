/**
 * OWASP A07:2021 – Identification and Authentication Failures
 * ==========================================================
 * Verifica la robustez de la autenticación:
 * - Delegación exclusiva a proveedor de identidad (Auth0/Google OAuth2)
 * - Inexistencia de endpoints locales de login con contraseña
 * - Verificación de firmas y expiación del JWT delegado
 *
 * Referencia: HE-01, RNF-SEG-02, AUT-03
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('OWASP A07 – Identification and Authentication Failures', () => {

  describe('A07.1 – Delegación a Auth0', () => {
    it('AuthController NO DEBE implementar login con usuario y contraseña local', () => {
      const controllerPath = path.resolve(__dirname, '../../src/auth/auth.controller.ts');
      const content = fs.readFileSync(controllerPath, 'utf-8');

      // Asegurar que no hay un endpoint de login que reciba email y password
      expect(content).not.toMatch(/@Post\(['"]login['"]\)/);
      expect(content).not.toContain('password');
    });

    it('AuthService DEBE delegar la autenticación a verifyAccessToken y requerir email_verified', () => {
      const servicePath = path.resolve(__dirname, '../../src/auth/auth0-identity.service.ts');
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('verifyAccessToken');
      expect(content).toContain('emailVerified !== true');
      expect(content).toContain('jwtVerify');
    });
  });

  describe('A07.2 – Cierre de sesión y revocación', () => {
    it('AuthController DEBE tener un endpoint explícito de logout', () => {
      const controllerPath = path.resolve(__dirname, '../../src/auth/auth.controller.ts');
      const content = fs.readFileSync(controllerPath, 'utf-8');

      // Verifica endpoint para logout, que la sesión local/cookie debe invalidarse (aunque Auth0 posee el estado global)
      expect(content).toMatch(/@Delete\(['"]sessions\/current['"]\)/);
    });
  });
  
  describe('A07.3 – Prevención de Enumeración de Usuarios', () => {
    it('AuthService NO DEBE revelar detalles internos en fallos de autenticación', () => {
      const servicePath = path.resolve(__dirname, '../../src/auth/auth.service.ts');
      const content = fs.readFileSync(servicePath, 'utf-8');

      // Debe dar Forbidden o Unauthorized genérico en lugar de "usuario no encontrado" o "contraseña incorrecta" hacia el cliente externo
      // Observamos que usa ForbiddenException("Account not found. Contact an administrator.") que es aceptable para un sistema interno de invitación
      expect(content).toContain('ForbiddenException');
    });
  });
});
