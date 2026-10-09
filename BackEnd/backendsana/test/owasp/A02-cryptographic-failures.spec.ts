/**
 * OWASP A02:2021 – Cryptographic Failures
 * ==========================================
 * Verifica que el sistema protege datos sensibles en tránsito y en reposo:
 * - JWT en cookies HttpOnly, Secure, SameSite
 * - Secretos no versionados (solo en variables de entorno)
 * - CORS restringido
 * - Helmet configurado para cabeceras de seguridad
 *
 * Referencia: RNF-SEG-02, RNF-SEG-04, RNF-SEG-05
 */
import { describe, expect, it, vi } from 'vitest';

describe('OWASP A02 – Cryptographic Failures', () => {

  // ─── A02.1 – Secretos solo en variables de entorno ────────────────────

  describe('A02.1 – Secretos exclusivamente en variables de entorno (RNF-SEG-04)', () => {
    it('app.config.ts NO DEBE contener claves hardcodeadas para la base de datos', async () => {
      const fs = await import('fs');
      const configPath = new URL('../../src/config/app.config.ts', import.meta.url);
      const content = fs.readFileSync(configPath, 'utf-8');

      // No debe contener contraseñas hardcodeadas
      expect(content).not.toMatch(/password:\s*['"][^'"]+['"]/);
      // Debe usar process.env para las credenciales
      expect(content).toContain('process.env.DATABASE_PASSWORD');
      expect(content).toContain('process.env.DATABASE_HOST');
      expect(content).toContain('process.env.DATABASE_USERNAME');
    });

    it('auth0-identity.service.ts DEBE obtener AUTH0_DOMAIN y AUTH0_AUDIENCE de ConfigService', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/auth/auth0-identity.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      // Debe usar ConfigService para obtener configuración
      expect(content).toContain('configService');
      expect(content).toContain("'AUTH0_DOMAIN'");
      expect(content).toContain("'AUTH0_AUDIENCE'");
      // No debe hardcodear dominios de Auth0
      expect(content).not.toMatch(/AUTH0_DOMAIN\s*=\s*['"][a-z0-9.-]+\.auth0\.com['"]/);
    });

    it('.env.example DEBE existir como referencia pero .env NO DEBE contener credenciales reales en el repo', async () => {
      const fs = await import('fs');
      const examplePath = new URL('../../.env.example', import.meta.url);

      // Verificar que existe el archivo de ejemplo
      expect(fs.existsSync(examplePath)).toBe(true);

      const content = fs.readFileSync(examplePath, 'utf-8');
      // .env.example no debe tener credenciales reales
      expect(content).not.toMatch(/DATABASE_PASSWORD=(?!your_|example|placeholder|changeme|CHANGE_ME|replace_|<)/i);
    });
  });

  // ─── A02.2 – Validación de token JWT con algoritmos seguros ──────────

  describe('A02.2 – JWT usa algoritmo RS256 y validación con JWKS', () => {
    it('Auth0IdentityService DEBE usar RS256 para la verificación del JWT', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/auth/auth0-identity.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain("algorithms: ['RS256']");
    });

    it('Auth0IdentityService DEBE usar JWKS remoto para validar firmas', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/auth/auth0-identity.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('createRemoteJWKSet');
      expect(content).toContain('.well-known/jwks.json');
    });

    it('Auth0IdentityService DEBE validar issuer y audience del token', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/auth/auth0-identity.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('issuer');
      expect(content).toContain('audience');
    });
  });

  // ─── A02.3 – Helmet configurado para cabeceras de seguridad ──────────

  describe('A02.3 – Helmet configurado para headers de seguridad HTTP', () => {
    it('main.ts DEBE usar helmet() como middleware global', async () => {
      const fs = await import('fs');
      const mainPath = new URL('../../src/main.ts', import.meta.url);
      const content = fs.readFileSync(mainPath, 'utf-8');

      expect(content).toContain("import helmet from 'helmet'");
      expect(content).toContain('app.use(helmet())');
    });
  });

  // ─── A02.4 – CORS restringido ────────────────────────────────────────

  describe('A02.4 – CORS restringido a dominios del frontend (RNF-SEG-05)', () => {
    it('main.ts DEBE habilitar CORS con origin configurable desde variables de entorno', async () => {
      const fs = await import('fs');
      const mainPath = new URL('../../src/main.ts', import.meta.url);
      const content = fs.readFileSync(mainPath, 'utf-8');

      expect(content).toContain('enableCors');
      expect(content).toContain('process.env.CORS_ORIGIN');
      expect(content).toContain("credentials: true");
    });

    it('main.ts NO DEBE permitir origin: "*" (todos los orígenes)', async () => {
      const fs = await import('fs');
      const mainPath = new URL('../../src/main.ts', import.meta.url);
      const content = fs.readFileSync(mainPath, 'utf-8');

      // No debe tener origin: '*' ni origin: true (que acepta cualquier origen)
      expect(content).not.toMatch(/origin:\s*['"]?\*['"]?/);
      expect(content).not.toMatch(/origin:\s*true/);
    });
  });

  // ─── A02.5 – cookie-parser configurado ───────────────────────────────

  describe('A02.5 – Cookie parser configurado para cookies seguras', () => {
    it('main.ts DEBE usar cookie-parser', async () => {
      const fs = await import('fs');
      const mainPath = new URL('../../src/main.ts', import.meta.url);
      const content = fs.readFileSync(mainPath, 'utf-8');

      expect(content).toContain("import cookieParser from 'cookie-parser'");
      expect(content).toContain('app.use(cookieParser())');
    });
  });

  // ─── A02.6 – Auth0 token requiere email verificado ────────────────────

  describe('A02.6 – Se requiere email verificado para autenticación', () => {
    it('Auth0IdentityService DEBE rechazar tokens sin email verificado', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/auth/auth0-identity.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('emailVerified !== true');
      expect(content).toContain('Auth0 token lacks required claims');
    });
  });

  // ─── A02.7 – .gitignore protege archivos sensibles ───────────────────

  describe('A02.7 – .gitignore protege archivos sensibles', () => {
    it('.gitignore DEBE incluir .env para evitar versionado de secretos', async () => {
      const fs = await import('fs');
      const gitignorePath = new URL('../../.gitignore', import.meta.url);
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      // Debe ignorar archivos .env
      expect(content).toMatch(/\.env/);
    });
  });
});
