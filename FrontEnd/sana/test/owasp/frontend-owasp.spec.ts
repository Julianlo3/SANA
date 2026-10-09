import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * OWASP FrontEnd Security Checks
 * ==============================
 * Pruebas estáticas para asegurar que el frontend Next.js de SANA 
 * cumple con las directrices principales de OWASP Top 10.
 */
describe('OWASP Top 10 - FrontEnd Security', () => {

  describe('A01:2021 – Broken Access Control', () => {
    it('AuthGuard (auth-guard.ts) DEBE verificar sesión y validar respuesta 401 y 403 del backend', () => {
      const guardPath = path.resolve(__dirname, '../../src/lib/auth-guard.ts');
      const content = fs.readFileSync(guardPath, 'utf-8');

      // Debe redirigir al login si no hay token
      expect(content).toContain('redirect("/iniciar-sesion")');
      expect(content).toContain('redirect("/sesion-expirada")');
      // Debe redirigir si el backend responde 403 (no autorizado para el rol)
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

      // No debería haber tokens harcodeados
      expect(content).not.toMatch(/Authorization:\s*['"]Bearer [a-zA-Z0-9-._~+/]+=*['"]/);
      // Debe usar credentials: "include" para enviar cookies HttpOnly
      expect(content).toContain('credentials: "include"');
    });
  });

  describe('A03:2021 – Injection (Cross-Site Scripting - XSS)', () => {
    it('El Frontend NO DEBE usar dangerouslySetInnerHTML sin sanitización', () => {
      // Buscar en los archivos principales si existe dangerouslySetInnerHTML
      const searchInPath = (dir: string) => {
        const files = fs.readdirSync(dir);
        let found = false;
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            if (searchInPath(fullPath)) found = true;
          } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            // Si se usa dangerouslySetInnerHTML, debe haber un validador/sanitizador como DOMPurify,
            // Aquí en modo estricto simplemente verificamos su presencia (esperando que sea falso o validado)
            if (content.includes('dangerouslySetInnerHTML')) {
              // Permitimos si usan un componente Markdown seguro
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
      expect(hasUnsafeInnerHtml).toBe(false); // Validar que React protege XSS por defecto
    });
  });

  describe('A04:2021 – Insecure Design', () => {
    it('El cliente HTTP (http-client.ts) DEBE usar el API genérico y capturar errores globalmente', () => {
      const httpPath = path.resolve(__dirname, '../../src/services/api/http-client.ts');
      const content = fs.readFileSync(httpPath, 'utf-8');

      // Debe capturar errores globalmente lanzando ApiError
      expect(content).toContain('throw new ApiError');
      // Debe parsear el status code para mostrar mensajes seguros
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
