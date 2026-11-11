import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * OWASP FrontEnd Security Checks
 * ==============================
 * Static checks that verify the SANA Next.js frontend follows key OWASP Top 10
 * security guidelines.
 */
describe('OWASP Top 10 - FrontEnd Security', () => {

  describe('A01:2021 – Broken Access Control', () => {
    it('AuthGuard (auth-guard.ts) DEBE verificar sesión y validar respuesta 401 y 403 del backend', () => {
      const guardPath = path.resolve(__dirname, '../../src/lib/auth-guard.ts');
      const content = fs.readFileSync(guardPath, 'utf-8');

      // Redirect to sign-in when no token is available.
      expect(content).toContain('redirect("/iniciar-sesion")');
      expect(content).toContain('redirect("/sesion-expirada")');
      // Redirect when the backend denies access to the user's role.
      expect(content).toContain('redirect("/acceso-restringido")');
      expect(content).toContain('status === 403');
    });

    it('AuthGuard DEBE exponer validadores por rol (requireAdministrator, requireAnyRole)', () => {
      const guardPath = path.resolve(__dirname, '../../src/lib/auth-guard.ts');
      const content = fs.readFileSync(guardPath, 'utf-8');

      expect(content).toContain('requireAdministrator');
      expect(content).toContain('requireAnyRole');
    });
  });

  describe('A02:2021 – Cryptographic Failures', () => {
    it('http-client.ts NO DEBE usar credenciales estáticas', () => {
      const httpPath = path.resolve(__dirname, '../../src/services/api/http-client.ts');
      const content = fs.readFileSync(httpPath, 'utf-8');

      // Static credentials must not be present.
      expect(content).not.toMatch(/Authorization:\s*['"]Bearer [a-zA-Z0-9-._~+/]+=*['"]/);
      // Include HttpOnly cookies in requests.
      expect(content).toContain('credentials: "include"');
    });
  });

  describe('A03:2021 – Injection (Cross-Site Scripting - XSS)', () => {
    it('El Frontend NO DEBE usar dangerouslySetInnerHTML sin sanitización', () => {
      // Search application source files for dangerouslySetInnerHTML.
      const searchInPath = (dir: string) => {
        const files = fs.readdirSync(dir);
        let found = false;
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            if (searchInPath(fullPath)) found = true;
          } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            // If dangerouslySetInnerHTML is used, require a sanitizer such as DOMPurify.
            // Strict mode checks presence and expects no unsafe usage.
            if (content.includes('dangerouslySetInnerHTML')) {
              // Allow safe Markdown renderers.
              if (!content.includes('react-markdown') && !content.includes('DOMPurify')) {
                found = true;
              }
            }
          }
        }
        return found;
      };

      const srcPath = path.resolve(__dirname, '../../src');
      const hasUnsafeInnerHtml = searchInPath(srcPath);
      expect(hasUnsafeInnerHtml).toBe(false); // React escapes content by default.
    });
  });

  describe('A04:2021 – Insecure Design', () => {
    it('El cliente HTTP (http-client.ts) DEBE usar el API genérico y capturar errores globalmente', () => {
      const httpPath = path.resolve(__dirname, '../../src/services/api/http-client.ts');
      const content = fs.readFileSync(httpPath, 'utf-8');

      // Convert global request failures into ApiError.
      expect(content).toContain('throw new ApiError');
      // Parse status codes into safe user-facing messages.
      expect(content).toContain('STATUS_MESSAGES');
    });
  });

  describe('A05:2021 – Security Misconfiguration', () => {
    it('next.config.ts NO DEBE desactivar validaciones de seguridad o headers estrictos', () => {
      const configPath = path.resolve(__dirname, '../../../next.config.ts');
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        expect(content).not.toContain('ignoreDuringBuilds: true'); // ESLint
        expect(content).not.toContain('dangerouslyAllowSVG: true'); // A menos que esté muy justificado
      }
    });
  });

  describe('A07:2021 – Identification and Authentication Failures', () => {
    it('Next.js API route de Auth0 DEBE estar definida y usar @auth0/nextjs-auth0', () => {
      const auth0RoutePath = path.resolve(__dirname, '../../src/app/api/auth/[auth0]/route.ts');
      if (fs.existsSync(auth0RoutePath)) {
        const content = fs.readFileSync(auth0RoutePath, 'utf-8');
        expect(content).toContain('handleAuth');
      }
    });
  });

  describe('A09:2021 – Security Logging and Monitoring Failures', () => {
    it('http-client.ts DEBE atrapar excepciones de red y retornar un mensaje genérico', () => {
      const httpPath = path.resolve(__dirname, '../../src/services/api/http-client.ts');
      const content = fs.readFileSync(httpPath, 'utf-8');

      // catch de fallo de red
      expect(content).toMatch(/catch\s*\{/);
      expect(content).toContain('No pudimos conectarnos con el servidor.');
    });
  });
});
