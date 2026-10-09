/**
 * OWASP A01:2021 – Broken Access Control
 * =========================================
 * Verifica que el sistema aplica correctamente la autorización por roles,
 * previene escalamiento de privilegios, IDOR (Insecure Direct Object Reference),
 * y que todos los endpoints protegidos requieren autenticación.
 *
 * Referencia: RNF-SEG-01, AUT-01, AUT-02, AUT-04, HU-1.1 E5
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { RolesGuard } from '../../src/guards/roles.guard.js';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard.js';
import { OriginGuard } from '../../src/guards/origin.guard.js';
import type { AuthenticatedUser } from '../../src/auth/auth.interface.js';
import { UserRole } from '../../src/models/user-role.enum.js';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    userId: 1,
    personId: 1,
    name: 'Test User',
    email: 'test@gmail.com',
    roles: [UserRole.Secretary],
    auth0Subject: 'google-oauth2|123',
    state: 'activo',
    termsAccepted: true,
    psyTermsAccepted: null,
    ...overrides,
  };
}

function makeExecutionContext(
  user?: AuthenticatedUser | undefined,
  handlerRoles?: string[],
  classRoles?: string[],
  origin?: string,
) {
  const request: Record<string, unknown> = {
    headers: { origin: origin ?? 'http://localhost:5173' },
    method: 'GET',
    originalUrl: '/api/v1/test',
    user,
  };

  const handlerMetadata = new Map<string, unknown>();
  if (handlerRoles) handlerMetadata.set('roles', handlerRoles);

  const classMetadata = new Map<string, unknown>();
  if (classRoles) classMetadata.set('roles', classRoles);

  const handler = { name: 'testHandler' };
  const classRef = { name: 'TestController' };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({
        setHeader: vi.fn(),
      }),
    }),
    getHandler: () => handler,
    getClass: () => classRef,
    _request: request,
  };
}

// ─── A01.1 – RolesGuard ────────────────────────────────────────────────

describe('OWASP A01 – Broken Access Control', () => {

  describe('A01.1 – RolesGuard impide acceso sin el rol requerido', () => {
    let guard: RolesGuard;
    const securityLogService = {
      logRoleMismatch: vi.fn().mockResolvedValue(undefined),
      logSecurityEvent: vi.fn().mockResolvedValue(undefined),
      logUnauthorizedAccess: vi.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
      vi.clearAllMocks();
      const reflector = {
        getAllAndOverride: vi.fn((key: string, targets: unknown[]) => {
          // Simula la metadata del handler
          if (key === 'roles') return ['administrador'];
          if (key === 'section') return 'Test Section';
          return undefined;
        }),
      };
      guard = new RolesGuard(reflector as never, securityLogService as never);
    });

    it('DEBE denegar acceso cuando el usuario tiene rol secretario pero se requiere administrador', () => {
      const user = makeUser({ roles: [UserRole.Secretary] });
      const ctx = makeExecutionContext(user, [UserRole.Administrator]);

      expect(() => guard.canActivate(ctx as never)).toThrow(ForbiddenException);
    });

    it('DEBE denegar acceso cuando el usuario tiene rol psicólogo pero se requiere administrador', () => {
      const user = makeUser({ roles: [UserRole.Psychologist] });
      const ctx = makeExecutionContext(user, [UserRole.Administrator]);

      expect(() => guard.canActivate(ctx as never)).toThrow(ForbiddenException);
    });

    it('DEBE denegar acceso cuando el usuario tiene rol marketing pero se requiere secretario', () => {
      const user = makeUser({ roles: [UserRole.Marketing] });
      const ctx = makeExecutionContext(user, [UserRole.Secretary]);

      expect(() => guard.canActivate(ctx as never)).toThrow(ForbiddenException);
    });

    it('DEBE registrar el intento de acceso denegado en la bitácora de seguridad (AUT-02)', () => {
      const user = makeUser({ userId: 99, roles: [UserRole.Secretary], email: 'intruder@gmail.com' });
      const ctx = makeExecutionContext(user, [UserRole.Administrator]);

      try { guard.canActivate(ctx as never); } catch { /* expected */ }

      expect(securityLogService.logRoleMismatch).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 99,
          email: 'intruder@gmail.com',
        }),
      );
    });

    it('DEBE denegar acceso si el usuario no tiene ningún rol asignado', () => {
      const user = makeUser({ roles: [] });
      const ctx = makeExecutionContext(user, [UserRole.Administrator]);

      expect(() => guard.canActivate(ctx as never)).toThrow(ForbiddenException);
    });

    it('DEBE denegar acceso si user es undefined en el request', () => {
      const ctx = makeExecutionContext(undefined, [UserRole.Administrator]);

      expect(() => guard.canActivate(ctx as never)).toThrow(ForbiddenException);
    });
  });

  // ─── A01.2 – RolesGuard permite acceso con el rol correcto ───────────

  describe('A01.2 – RolesGuard permite acceso con rol correcto', () => {
    let guard: RolesGuard;

    beforeEach(() => {
      const reflector = {
        getAllAndOverride: vi.fn((key: string) => {
          if (key === 'roles') return [UserRole.Administrator];
          return undefined;
        }),
      };
      guard = new RolesGuard(
        reflector as never,
        { logRoleMismatch: vi.fn() } as never,
      );
    });

    it('DEBE permitir acceso cuando el usuario es administrador y se requiere administrador', () => {
      const user = makeUser({ roles: [UserRole.Administrator] });
      const ctx = makeExecutionContext(user, [UserRole.Administrator]);

      expect(guard.canActivate(ctx as never)).toBe(true);
    });
  });

  // ─── A01.3 – RolesGuard sin metadata de roles (ruta pública) ────────

  describe('A01.3 – Rutas sin metadata de roles son accesibles', () => {
    it('DEBE permitir el acceso cuando no se definen roles requeridos (ruta pública)', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue(undefined),
      };
      const guard = new RolesGuard(reflector as never, {} as never);
      const ctx = makeExecutionContext(undefined);

      expect(guard.canActivate(ctx as never)).toBe(true);
    });
  });

  // ─── A01.4 – Prevención de escalamiento vertical de privilegios ─────

  describe('A01.4 – Prevención de escalamiento vertical de privilegios', () => {
    it('DEBE impedir que un consultante acceda a endpoints de administrador', () => {
      const reflector = {
        getAllAndOverride: vi.fn((key: string) => {
          if (key === 'roles') return [UserRole.Administrator];
          return undefined;
        }),
      };
      const guard = new RolesGuard(
        reflector as never,
        { logRoleMismatch: vi.fn().mockResolvedValue(undefined) } as never,
      );
      const user = makeUser({ roles: [UserRole.Requester] });
      const ctx = makeExecutionContext(user, [UserRole.Administrator]);

      expect(() => guard.canActivate(ctx as never)).toThrow(ForbiddenException);
    });

    it('DEBE impedir que un psicólogo modifique usuarios (solo administrador)', () => {
      const reflector = {
        getAllAndOverride: vi.fn((key: string) => {
          if (key === 'roles') return [UserRole.Administrator];
          return undefined;
        }),
      };
      const guard = new RolesGuard(
        reflector as never,
        { logRoleMismatch: vi.fn().mockResolvedValue(undefined) } as never,
      );
      const user = makeUser({ roles: [UserRole.Psychologist] });
      const ctx = makeExecutionContext(user, [UserRole.Administrator]);

      expect(() => guard.canActivate(ctx as never)).toThrow(ForbiddenException);
    });
  });

  // ─── A01.5 – OriginGuard rechaza orígenes no permitidos ─────────────

  describe('A01.5 – OriginGuard rechaza orígenes no permitidos', () => {
    it('DEBE rechazar requests desde un origen no configurado en CORS_ORIGIN', () => {
      const configService = {
        getOrThrow: vi.fn().mockReturnValue('http://localhost:5173,https://sana.vercel.app'),
      };
      const guard = new OriginGuard(configService as never);
      const ctx = makeExecutionContext(undefined, undefined, undefined, 'http://evil-site.com');

      expect(() => guard.canActivate(ctx as never)).toThrow(ForbiddenException);
    });

    it('DEBE rechazar requests sin header Origin', () => {
      const configService = {
        getOrThrow: vi.fn().mockReturnValue('http://localhost:5173'),
      };
      const guard = new OriginGuard(configService as never);
      const ctx = makeExecutionContext(undefined, undefined, undefined, undefined);
      // Simular sin origin
      (ctx._request.headers as Record<string, unknown>).origin = undefined;

      expect(() => guard.canActivate(ctx as never)).toThrow(ForbiddenException);
    });

    it('DEBE aceptar requests desde el origen permitido', () => {
      const configService = {
        getOrThrow: vi.fn().mockReturnValue('http://localhost:5173'),
      };
      const guard = new OriginGuard(configService as never);
      const ctx = makeExecutionContext(undefined, undefined, undefined, 'http://localhost:5173');

      expect(guard.canActivate(ctx as never)).toBe(true);
    });
  });

  // ─── A01.6 – JwtAuthGuard exige token Bearer ────────────────────────

  describe('A01.6 – JwtAuthGuard exige token de autenticación', () => {
    it('DEBE lanzar UnauthorizedException si no se proporciona el header Authorization', async () => {
      const authService = { authenticateAuth0: vi.fn() };
      const auth0IdentityService = { verifyAccessToken: vi.fn() };
      const guard = new JwtAuthGuard(authService as never, auth0IdentityService as never);

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      };

      await expect(guard.canActivate(ctx as never)).rejects.toThrow(UnauthorizedException);
    });

    it('DEBE lanzar UnauthorizedException si el header Authorization no tiene formato Bearer', async () => {
      const authService = { authenticateAuth0: vi.fn() };
      const auth0IdentityService = { verifyAccessToken: vi.fn() };
      const guard = new JwtAuthGuard(authService as never, auth0IdentityService as never);

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Basic abc123' },
          }),
        }),
      };

      await expect(guard.canActivate(ctx as never)).rejects.toThrow(UnauthorizedException);
    });

    it('DEBE lanzar UnauthorizedException si el token es vacío', async () => {
      const authService = { authenticateAuth0: vi.fn() };
      const auth0IdentityService = { verifyAccessToken: vi.fn() };
      const guard = new JwtAuthGuard(authService as never, auth0IdentityService as never);

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer ' },
          }),
        }),
      };

      await expect(guard.canActivate(ctx as never)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── A01.7 – AuthService bloquea cuentas inactivas/bloqueadas ───────

  describe('A01.7 – Cuentas bloqueadas/desactivadas no pueden autenticarse (AUT-04)', () => {
    it('DEBE verificar que AuthService deniega acceso a cuentas bloqueadas', async () => {
      // Este test verifica la lógica del servicio de autenticación:
      // Si record.state !== AccountState.Active → ForbiddenException
      const { AuthService } = await import('../../src/auth/auth.service.js');

      const mockRepository = {
        findByProviderId: vi.fn().mockResolvedValue({
          userId: 1,
          personId: 1,
          email: 'blocked@gmail.com',
          name: 'Blocked User',
          roles: ['administrador'],
          state: 'bloqueado',
          providerId: 'google-oauth2|123',
          termsAccepted: true,
          psyTermsAccepted: null,
        }),
        updateLastLogin: vi.fn(),
        updateEmail: vi.fn(),
      };
      const mockSecurityLog = {
        logUnauthorizedAccess: vi.fn().mockResolvedValue(undefined),
        logSecurityEvent: vi.fn().mockResolvedValue(undefined),
      };

      const service = new AuthService(mockRepository as never, mockSecurityLog as never);

      await expect(
        service.authorizeAuth0({
          subject: 'google-oauth2|123',
          email: 'blocked@gmail.com',
          name: 'Blocked User',
          isEmailVerified: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('DEBE verificar que AuthService deniega acceso a cuentas inactivas', async () => {
      const { AuthService } = await import('../../src/auth/auth.service.js');

      const mockRepository = {
        findByProviderId: vi.fn().mockResolvedValue({
          userId: 2,
          personId: 2,
          email: 'inactive@gmail.com',
          name: 'Inactive User',
          roles: ['secretario'],
          state: 'inactivo',
          providerId: 'google-oauth2|456',
          termsAccepted: true,
          psyTermsAccepted: null,
        }),
        updateLastLogin: vi.fn(),
        updateEmail: vi.fn(),
      };
      const mockSecurityLog = {
        logUnauthorizedAccess: vi.fn().mockResolvedValue(undefined),
        logSecurityEvent: vi.fn().mockResolvedValue(undefined),
      };

      const service = new AuthService(mockRepository as never, mockSecurityLog as never);

      await expect(
        service.authorizeAuth0({
          subject: 'google-oauth2|456',
          email: 'inactive@gmail.com',
          name: 'Inactive User',
          isEmailVerified: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── A01.8 – Cada controlador protegido usa los guards correctos ────

  describe('A01.8 – Todos los controladores protegidos declaran guards', () => {
    it('UsersController DEBE usar OriginGuard, JwtAuthGuard y RolesGuard', async () => {
      const { UsersController } = await import('../../src/users/users.controller.js');

      const guards = Reflect.getMetadata('__guards__', UsersController);
      const guardNames = guards?.map((g: Function) => g.name) ?? [];

      expect(guardNames).toContain('OriginGuard');
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });

    it('ConsultantsController DEBE usar OriginGuard, JwtAuthGuard y RolesGuard', async () => {
      const { ConsultantsController } = await import('../../src/consultants/consultants.controller.js');

      const guards = Reflect.getMetadata('__guards__', ConsultantsController);
      const guardNames = guards?.map((g: Function) => g.name) ?? [];

      expect(guardNames).toContain('OriginGuard');
      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
    });

    it('UsersController DEBE requerir rol Administrador por defecto', async () => {
      const { UsersController } = await import('../../src/users/users.controller.js');
      const roles = Reflect.getMetadata('roles', UsersController);

      expect(roles).toContain(UserRole.Administrator);
    });

    it('ConsultantsController DEBE requerir rol Secretario por defecto', async () => {
      const { ConsultantsController } = await import('../../src/consultants/consultants.controller.js');
      const roles = Reflect.getMetadata('roles', ConsultantsController);

      expect(roles).toContain(UserRole.Secretary);
    });
  });
});
