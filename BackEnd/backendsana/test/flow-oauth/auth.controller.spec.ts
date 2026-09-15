import { describe, expect, it } from 'vitest';
import { AuthController } from '../../src/controllers/auth.controller.js';

describe('AuthController', () => {
  it('returns the authenticated local identity from the Auth0 guard', () => {
    const controller = new AuthController();
    const user = {
      userId: 1,
      personId: 1,
      email: 'user@example.com',
      roles: ['psicologo'],
      auth0Subject: 'auth0|user-1',
    };

    expect(controller.me({ user } as never)).toBe(user);
  });
});
