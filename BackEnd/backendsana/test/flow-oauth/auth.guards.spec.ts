import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard.js';
import { OriginGuard } from '../../src/guards/origin.guard.js';
import { RolesGuard } from '../../src/guards/roles.guard.js';

function context(request: Record<string, unknown>) {
  // Simula solo la parte del ExecutionContext que los guards consumen.
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => 'handler',
    getClass: () => 'class',
  };
}

describe('OriginGuard', () => {
  const guard = new OriginGuard({
    getOrThrow: () => 'https://app.example, https://admin.example',
  } as never);

  it('allows configured origins after trimming configuration values', () => {
    expect(
      guard.canActivate(
        context({ headers: { origin: 'https://admin.example' } }) as never,
      ),
    ).toBe(true);
  });

  it.each([undefined, 'https://attacker.example'])(
    'rejects missing and unconfigured origins',
    (origin) => {
      expect(() =>
        guard.canActivate(context({ headers: { origin } }) as never),
      ).toThrow(ForbiddenException);
    },
  );
});

describe('JwtAuthGuard', () => {
  it('extracts a bearer token and attaches its authenticated user', async () => {
    const verifyAccessToken = vi.fn().mockResolvedValue({ subject: 'auth0|1' });
    const authenticateAuth0 = vi.fn().mockResolvedValue({ userId: 1 });
    const guard = new JwtAuthGuard(
      { authenticateAuth0 } as never,
      { verifyAccessToken } as never,
    );
    const request = { headers: { authorization: 'Bearer access-token' } };

    await expect(guard.canActivate(context(request) as never)).resolves.toBe(
      true,
    );
    expect(verifyAccessToken).toHaveBeenCalledWith('access-token');
    expect(authenticateAuth0).toHaveBeenCalledWith({ subject: 'auth0|1' });
    expect(request).toMatchObject({ user: { userId: 1 } });
  });

  it.each(['Basic abc', undefined])(
    'rejects a missing or non-bearer authorization header',
    async (authorization) => {
      const guard = new JwtAuthGuard(
        { authenticateAuth0: vi.fn() } as never,
        { verifyAccessToken: vi.fn() } as never,
      );
      await expect(
        guard.canActivate(context({ headers: { authorization } }) as never),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );
});

describe('RolesGuard', () => {
  it('allows routes without role metadata', () => {
    const guard = new RolesGuard({
      getAllAndOverride: () => undefined,
    } as never, { logRoleMismatch: vi.fn() } as never);
    expect(guard.canActivate(context({}) as never)).toBe(true);
  });

  it('only permits a user that has one required role', () => {
    const guard = new RolesGuard({
      getAllAndOverride: () => ['administrador', 'psicologo'],
    } as never, { logRoleMismatch: vi.fn() } as never);
    expect(
      guard.canActivate(context({ user: { roles: ['psicologo'] } }) as never),
    ).toBe(true);
    expect(
      guard.canActivate(context({ user: { roles: ['consultante'] } }) as never),
    ).toBe(false);
  });
});
// Normaliza espacios en CORS_ORIGIN antes de comparar el Origin recibido.
// Copia el usuario validado a request.user para los controladores posteriores.
// Las rutas públicas no declaran metadatos de roles.
// Basta que el usuario posea uno de los roles exigidos por la ruta.
