import { describe, expect, it, vi } from 'vitest';
import { AuthController } from '../../src/controllers/auth.controller.js';

describe('AuthController', () => {
  const authService = {
    acceptTerms: vi.fn(),
    acceptPsychologistTerms: vi.fn(),
  };

  function setup() {
    vi.clearAllMocks();
    return new AuthController(authService as never);
  }

  it('returns the authenticated local identity from the Auth0 guard', () => {
    const controller = setup();
    const user = {
      userId: 1,
      personId: 1,
      email: 'user@example.com',
      roles: ['psicologo'],
      auth0Subject: 'auth0|user-1',
    };

    expect(controller.me({ user } as never)).toBe(user);
  });

  it('delegates platform terms acceptance to the auth service', async () => {
    const controller = setup();
    const request = {
      user: {
        userId: 1,
        personId: 42,
        email: 'user@example.com',
        roles: ['psicologo'],
        auth0Subject: 'auth0|user-1',
      },
    };

    await expect(controller.acceptTerms(request as never)).resolves.toEqual({
      message: 'Términos y condiciones aceptados correctamente',
      termsAccepted: true,
    });
    expect(authService.acceptTerms).toHaveBeenCalledWith(42);
  });
});
