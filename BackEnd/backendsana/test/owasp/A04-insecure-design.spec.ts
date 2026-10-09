/**
 * OWASP A04:2021 – Insecure Design
 * ===================================
 * Verifica que el sistema implementa patrones de diseño seguro:
 * - Lógica de negocio en servicios, no en controladores
 * - Guard de autenticación antes del guard de roles
 * - Validación de estado de cuenta antes de autorizar
 * - Rate limiting para prevenir abuso
 * - Registro de auditoría para cambios sensibles
 *
 * Referencia: 5.4, RNF-AUD-01, AUT-02, AUT-03
 */
import { describe, expect, it, vi } from 'vitest';

describe('OWASP A04 – Insecure Design', () => {

  // ─── A04.1 – Lógica de negocio solo en servicios ──────────────────────

  describe('A04.1 – Sin lógica de negocio en controladores (5.4)', () => {
    it('UsersController DEBE delegar toda lógica al servicio sin manipulación directa', async () => {
      const fs = await import('fs');
      const controllerPath = new URL('../../src/users/users.controller.ts', import.meta.url);
      const content = fs.readFileSync(controllerPath, 'utf-8');

      // El controlador no debe tener imports de TypeORM ni acceso directo a repos
      expect(content).not.toContain('Repository');
      expect(content).not.toContain('DataSource');
      expect(content).not.toContain('EntityManager');
      // Debe delegar al servicio
      expect(content).toContain('this.usersService');
    });

    it('ConsultantsController DEBE delegar toda lógica al servicio', async () => {
      const fs = await import('fs');
      const controllerPath = new URL('../../src/consultants/consultants.controller.ts', import.meta.url);
      const content = fs.readFileSync(controllerPath, 'utf-8');

      expect(content).not.toContain('Repository');
      expect(content).not.toContain('DataSource');
      expect(content).toContain('this.consultantsService');
    });

    it('AuthController DEBE delegar toda lógica al AuthService', async () => {
      const fs = await import('fs');
      const controllerPath = new URL('../../src/auth/auth.controller.ts', import.meta.url);
      const content = fs.readFileSync(controllerPath, 'utf-8');

      expect(content).not.toContain('Repository');
      expect(content).not.toContain('DataSource');
      expect(content).toContain('this.authService');
    });
  });

  // ─── A04.2 – Orden correcto de guards ─────────────────────────────────

  describe('A04.2 – Guards en orden correcto: Origin → JWT → Roles', () => {
    it('UsersController DEBE declarar guards en orden: OriginGuard, JwtAuthGuard, RolesGuard', async () => {
      const { UsersController } = await import('../../src/users/users.controller.js');
      const guards = Reflect.getMetadata('__guards__', UsersController);

      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThanOrEqual(3);

      const guardNames = guards.map((g: Function) => g.name);
      const originIdx = guardNames.indexOf('OriginGuard');
      const jwtIdx = guardNames.indexOf('JwtAuthGuard');
      const rolesIdx = guardNames.indexOf('RolesGuard');

      // OriginGuard debe ejecutarse antes que JwtAuthGuard
      expect(originIdx).toBeLessThan(jwtIdx);
      // JwtAuthGuard debe ejecutarse antes que RolesGuard
      expect(jwtIdx).toBeLessThan(rolesIdx);
    }, 15000);
  });

  // ─── A04.3 – Rate limiting presente ────────────────────────────────────

  describe('A04.3 – Rate limiting configurado contra abuso', () => {
    it('RateLimitGuard DEBE imponer un límite configurable de requests por ventana de tiempo', async () => {
      const fs = await import('fs');
      const guardPath = new URL('../../src/guards/rate-limit.guard.ts', import.meta.url);
      const content = fs.readFileSync(guardPath, 'utf-8');

      // Debe tener límite y ventana
      expect(content).toContain('limit');
      expect(content).toContain('windowMs');
      expect(content).toContain('TOO_MANY_REQUESTS');
    });

    it('RateLimitGuard DEBE enviar header Retry-After cuando se excede el límite', async () => {
      const fs = await import('fs');
      const guardPath = new URL('../../src/guards/rate-limit.guard.ts', import.meta.url);
      const content = fs.readFileSync(guardPath, 'utf-8');

      expect(content).toContain('Retry-After');
      expect(content).toContain('X-RateLimit-Limit');
      expect(content).toContain('X-RateLimit-Remaining');
    });

    it('AuthController DEBE usar RateLimitGuard para prevenir brute force', async () => {
      const { AuthController } = await import('../../src/auth/auth.controller.js');
      const guards = Reflect.getMetadata('__guards__', AuthController);
      const guardNames = guards?.map((g: Function) => g.name) ?? [];

      expect(guardNames).toContain('RateLimitGuard');
    }, 15000);

    it('RateLimitGuard DEBE tener un límite máximo de buckets para prevenir agotamiento de memoria', async () => {
      const fs = await import('fs');
      const guardPath = new URL('../../src/guards/rate-limit.guard.ts', import.meta.url);
      const content = fs.readFileSync(guardPath, 'utf-8');

      expect(content).toContain('maxBuckets');
      expect(content).toContain('SERVICE_UNAVAILABLE');
    });
  });

  // ─── A04.4 – Auditoría de eventos de seguridad ─────────────────────────

  describe('A04.4 – Registro de auditoría para accesos denegados (RNF-AUD-01)', () => {
    it('SecurityLogService DEBE registrar eventos en security_access_log', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/security-logs/security-log.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('security_access_log');
      expect(content).toContain('logSecurityEvent');
    });

    it('SecurityLogService DEBE enmascarar emails en los logs (data minimization)', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/security-logs/security-log.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('maskEmail');
    });

    it('SecurityLogService.maskEmail DEBE ocultar el nombre del email', async () => {
      const { SecurityLogService } = await import('../../src/security-logs/security-log.service.js');
      const service = new SecurityLogService({ query: vi.fn() } as never);

      // Acceder a la función privada por reflexión
      const masked = (service as unknown as { maskEmail: (email: string) => string }).maskEmail('juan.perez@gmail.com');

      // El email debe estar enmascarado
      expect(masked).not.toContain('juan.perez');
      expect(masked).toContain('@gmail.com');
      expect(masked).toContain('***');
    });

    it('RolesGuard DEBE registrar el intento en la bitácora cuando un usuario autenticado es denegado', async () => {
      const fs = await import('fs');
      const guardPath = new URL('../../src/guards/roles.guard.ts', import.meta.url);
      const content = fs.readFileSync(guardPath, 'utf-8');

      expect(content).toContain('securityLogService');
      expect(content).toContain('logRoleMismatch');
    });
  });

  // ─── A04.5 – Usuarios no pueden eliminar si hay registros ──────────────

  describe('A04.5 – Prevención de eliminación de usuarios con registros asociados', () => {
    it('UsersService DEBE impedir eliminación de usuario con citas, horarios o dependientes', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/users/users.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('USER_HAS_RECORDS');
      expect(content).toContain('findAssociatedRecords');
      expect(content).toContain('ConflictException');
    });
  });

  // ─── A04.6 – Actualización de last_login en cada inicio de sesión ─────

  describe('A04.6 – Registro de último login (AUT-03)', () => {
    it('AuthService DEBE actualizar lastLogin en cada autenticación exitosa', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/auth/auth.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('updateLastLogin');
    });
  });

  // ─── A04.7 – Duplicados en creación de consultantes ───────────────────

  describe('A04.7 – Prevención de registros duplicados por documento', () => {
    it('ConsultantsService DEBE verificar duplicados por identityDocument antes de crear', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/consultants/consultants.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('CONSULTANT_ALREADY_EXISTS');
      expect(content).toContain('perIdentityDocument');
    });

    it('UsersService DEBE verificar duplicados por email antes de crear', async () => {
      const fs = await import('fs');
      const servicePath = new URL('../../src/users/users.service.ts', import.meta.url);
      const content = fs.readFileSync(servicePath, 'utf-8');

      expect(content).toContain('EMAIL_ALREADY_REGISTERED');
    });
  });
});
