/**
 * OWASP A05:2021 – Security Misconfiguration
 * =============================================
 * Verifica configuraciones de seguridad del servidor:
 * - Helmet para cabeceras HTTP seguras
 * - Validación de variables de entorno requeridas
 * - Synchronize: false para TypeORM en producción
 * - Trust proxy configurado
 * - Sin información de debug expuesta a clientes
 *
 * Referencia: RNF-SEG-01, RNF-SEG-04, DB-01
 */
import { describe, expect, it } from 'vitest';

describe('OWASP A05 – Security Misconfiguration', () => {

  // ─── A05.1 – Helmet activado ──────────────────────────────────────────

  describe('A05.1 – Helmet activado como middleware global', () => {
    it('main.ts DEBE importar y usar helmet', async () => {
      const fs = await import('fs');
      const mainPath = new URL('../../src/main.ts', import.meta.url);
      const content = fs.readFileSync(mainPath, 'utf-8');

      expect(content).toContain("import helmet from 'helmet'");
      expect(content).toContain('app.use(helmet())');
    });
  });

  // ─── A05.2 – Validación de entorno ────────────────────────────────────

  describe('A05.2 – Variables de entorno validadas al arrancar', () => {
    it('validateEnvironment DEBE lanzar error si falta CORS_ORIGIN', async () => {
      const { validateEnvironment } = await import('../../src/config/app.config.js');

      expect(() =>
        validateEnvironment({
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: 5432,
          DATABASE_USERNAME: 'test',
          DATABASE_PASSWORD: 'test',
          DATABASE_NAME: 'test',
          AUTH0_DOMAIN: 'test.auth0.com',
          AUTH0_AUDIENCE: 'https://api.test.com',
          AUTH0_CLAIM_NAMESPACE: 'https://sana.app',
          // CORS_ORIGIN omitido intencionalmente
        }),
      ).toThrow();
    });

    it('validateEnvironment DEBE lanzar error si falta AUTH0_DOMAIN', async () => {
      const { validateEnvironment } = await import('../../src/config/app.config.js');

      expect(() =>
        validateEnvironment({
          CORS_ORIGIN: 'http://localhost:5173',
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: 5432,
          DATABASE_USERNAME: 'test',
          DATABASE_PASSWORD: 'test',
          DATABASE_NAME: 'test',
          // AUTH0_DOMAIN omitido intencionalmente
          AUTH0_AUDIENCE: 'https://api.test.com',
          AUTH0_CLAIM_NAMESPACE: 'https://sana.app',
        }),
      ).toThrow();
    });

    it('validateEnvironment DEBE lanzar error si falta DATABASE_PASSWORD', async () => {
      const { validateEnvironment } = await import('../../src/config/app.config.js');

      expect(() =>
        validateEnvironment({
          CORS_ORIGIN: 'http://localhost:5173',
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: 5432,
          DATABASE_USERNAME: 'test',
          // DATABASE_PASSWORD omitido intencionalmente
          DATABASE_NAME: 'test',
          AUTH0_DOMAIN: 'test.auth0.com',
          AUTH0_AUDIENCE: 'https://api.test.com',
          AUTH0_CLAIM_NAMESPACE: 'https://sana.app',
        }),
      ).toThrow();
    });

    it('validateEnvironment DEBE aceptar una configuración completa válida', async () => {
      const { validateEnvironment } = await import('../../src/config/app.config.js');

      const result = validateEnvironment({
        CORS_ORIGIN: 'http://localhost:5173',
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: 5432,
        DATABASE_USERNAME: 'test',
        DATABASE_PASSWORD: 'test',
        DATABASE_NAME: 'sanadb',
        AUTH0_DOMAIN: 'test.auth0.com',
        AUTH0_AUDIENCE: 'https://api.test.com',
        AUTH0_CLAIM_NAMESPACE: 'https://sana.app',
      });

      expect(result).toBeDefined();
      expect(result.CORS_ORIGIN).toBe('http://localhost:5173');
    });
  });

  // ─── A05.3 – synchronize: false en TypeORM ────────────────────────────

  describe('A05.3 – TypeORM synchronize desactivado (DB-01)', () => {
    it('appConfig DEBE tener synchronize: false para evitar cambios automáticos en el esquema', async () => {
      const { appConfig } = await import('../../src/config/app.config.js');
      const config = appConfig();

      expect(config.synchronize).toBe(false);
    });
  });

  // ─── A05.4 – Trust proxy controlado ───────────────────────────────────

  describe('A05.4 – Trust proxy configurado correctamente', () => {
    it('main.ts DEBE configurar trust proxy desde variable de entorno (no ilimitado)', async () => {
      const fs = await import('fs');
      const mainPath = new URL('../../src/main.ts', import.meta.url);
      const content = fs.readFileSync(mainPath, 'utf-8');

      expect(content).toContain('trust proxy');
      expect(content).toContain('TRUST_PROXY_HOPS');
      // No debe confiar en todos los proxies ciegamente
      expect(content).not.toMatch(/trust proxy.*true/i);
    });

    it('validateEnvironment DEBE validar que TRUST_PROXY_HOPS sea un entero >= 0', async () => {
      const { validateEnvironment } = await import('../../src/config/app.config.js');

      expect(() =>
        validateEnvironment({
          CORS_ORIGIN: 'http://localhost:5173',
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: 5432,
          DATABASE_USERNAME: 'test',
          DATABASE_PASSWORD: 'test',
          DATABASE_NAME: 'test',
          AUTH0_DOMAIN: 'test.auth0.com',
          AUTH0_AUDIENCE: 'https://api.test.com',
          AUTH0_CLAIM_NAMESPACE: 'https://sana.app',
          TRUST_PROXY_HOPS: -1,
        }),
      ).toThrow();
    });
  });

  // ─── A05.5 – autoLoadEntities habilitado ──────────────────────────────

  describe('A05.5 – autoLoadEntities habilitado para evitar entidades faltantes', () => {
    it('appConfig DEBE tener autoLoadEntities: true', async () => {
      const { appConfig } = await import('../../src/config/app.config.js');
      const config = appConfig();

      expect(config.autoLoadEntities).toBe(true);
    });
  });

  // ─── A05.6 – Mensajes de error no exponen detalles internos ────────────

  describe('A05.6 – Mensajes de error no exponen información interna', () => {
    it('AuthService DEBE usar mensajes genéricos para estados de cuenta no activos', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/auth/auth.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      // No debe revelar si la cuenta está bloqueada vs inactiva al usuario externo
      expect(content).toContain('Account is not active');
      // No debe exponer stack traces o información de base de datos en ForbiddenException
      expect(content).not.toMatch(/ForbiddenException\(['"].*SQL/);
    });

    it('OriginGuard DEBE dar un mensaje genérico sin revelar los orígenes permitidos', async () => {
      const fs = await import('fs');
      const guardPath = new URL('../../src/guards/origin.guard.ts', import.meta.url);
      const content = fs.readFileSync(guardPath, 'utf-8');

      expect(content).toContain('Request origin is not allowed');
      // No debe listar los orígenes permitidos en el mensaje de error
      expect(content).not.toMatch(/ForbiddenException.*allowedOrigins/);
    });
  });
});
