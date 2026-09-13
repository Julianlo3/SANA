import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { GoogleIdentityService } from '../../src/services/google-identity.service.js';

describe('GoogleIdentityService', () => {
  const configService = {
    getOrThrow: vi.fn(
      () => process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id',
    ),
  };

  function serviceWith(payload: unknown, rejects = false) {
    const service = new GoogleIdentityService(configService as never);
    (
      service as unknown as {
        client: { verifyIdToken: ReturnType<typeof vi.fn> };
      }
    ).client = {
      verifyIdToken: rejects
        ? vi.fn().mockRejectedValue(new Error('invalid token'))
        : vi.fn().mockResolvedValue({ getPayload: () => payload }),
    };
    return service;
  }

  it('returns the normalized Google profile after a valid verification', async () => {
    const service = serviceWith({
      sub: 'google-123',
      email: 'user@example.com',
      email_verified: true,
      nonce: 'nonce',
      name: 'User',
    });

    await expect(service.verifyIdToken('id-token', 'nonce')).resolves.toEqual({
      googleId: 'google-123',
      email: 'user@example.com',
      name: 'User',
      isEmailVerified: true,
    });
  });

  // Cada perfil omite o altera un dato que Google debe validar.
  it.each([
    [{ email: 'user@example.com', email_verified: true, nonce: 'nonce' }],
    [{ sub: 'id', email_verified: true, nonce: 'nonce' }],
    [
      {
        sub: 'id',
        email: 'user@example.com',
        email_verified: false,
        nonce: 'nonce',
      },
    ],
    [
      {
        sub: 'id',
        email: 'user@example.com',
        email_verified: true,
        nonce: 'other',
      },
    ],
  ])('rejects an incomplete or mismatched Google identity', async (payload) => {
    await expect(
      serviceWith(payload).verifyIdToken('token', 'nonce'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // Distingue un token rechazado por Google de un perfil válido pero incompleto.
  it('maps errors from Google to an unauthorized response', async () => {
    await expect(
      serviceWith(null, true).verifyIdToken('bad', 'nonce'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
// Sustituye la llamada HTTP a Google por una respuesta controlada.
