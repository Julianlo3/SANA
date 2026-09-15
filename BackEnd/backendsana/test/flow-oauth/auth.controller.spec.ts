import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from '../../src/controllers/auth.controller.js';

describe('AuthController', () => {
  const config = {
    getOrThrow: vi.fn(
      (key: string) =>
        ({
          COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
          COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE ?? 'lax',
          JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL ?? '7d',
        })[key],
    ),
  };
  const auth = {
    signIn: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  };
  const google = { verifyIdToken: vi.fn() };

  function setup() {
    vi.clearAllMocks();
    return new AuthController(auth as never, google as never, config as never);
  }

  it('issues a nonce in an http-only cookie', () => {
    const response = { cookie: vi.fn() };
    const result = setup().createGoogleNonce(response as never);

    expect(result.nonce).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.cookie).toHaveBeenCalledWith(
      'sana-g-nonce',
      result.nonce,
      expect.objectContaining({ httpOnly: true, maxAge: 300000 }),
    );
  });

  it('rejects sign-in before contacting Google when the nonce is invalid', async () => {
    const response = { clearCookie: vi.fn(), cookie: vi.fn() };
    await expect(
      setup().googleSignIn(
        { idToken: 'token', nonce: 'wrong' },
        { cookies: { 'sana-g-nonce': 'expected' } } as never,
        response as never,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(google.verifyIdToken).not.toHaveBeenCalled();
  });

  it('exchanges a verified identity for an access token and refresh cookie', async () => {
    const response = { clearCookie: vi.fn(), cookie: vi.fn() };
    google.verifyIdToken.mockResolvedValue({ googleId: 'id' });
    auth.signIn.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    await expect(
      setup().googleSignIn(
        { idToken: 'token', nonce: 'expected' },
        { cookies: { 'sana-g-nonce': 'expected' } } as never,
        response as never,
      ),
    ).resolves.toEqual({ accessToken: 'access' });
    expect(response.clearCookie).toHaveBeenCalledWith(
      'sana-g-nonce',
      expect.any(Object),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'sana-refresh',
      'refresh',
      expect.objectContaining({ maxAge: 604800000 }),
    );
  });

  it('requires a refresh cookie and rotates it after a successful refresh', async () => {
    const response = { cookie: vi.fn() };
    await expect(
      setup().refresh({ cookies: {} } as never, response as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    auth.refresh.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    await expect(
      setup().refresh(
        { cookies: { 'sana-refresh': 'old' } } as never,
        response as never,
      ),
    ).resolves.toEqual({ accessToken: 'new-access' });
    expect(auth.refresh).toHaveBeenCalledWith('old');
    expect(response.cookie).toHaveBeenCalledWith(
      'sana-refresh',
      'new-refresh',
      expect.any(Object),
    );
  });

  it('clears the refresh cookie when token rotation rejects an invalid token', async () => {
    const response = { cookie: vi.fn(), clearCookie: vi.fn() };
    auth.refresh.mockRejectedValue(new UnauthorizedException());

    await expect(
      setup().refresh(
        { cookies: { 'sana-refresh': 'reused-token' } } as never,
        response as never,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(response.clearCookie).toHaveBeenCalledWith(
      'sana-refresh',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
  });
});
// El nonce retornado y el almacenado en cookie deben ser el mismo valor UUID.
// Evita verificar un token si no pertenece al inicio de sesión que creó la cookie.
// El refresh token nunca se devuelve en el cuerpo de la respuesta.
// Una renovación válida reemplaza el refresh token anterior en la cookie.
