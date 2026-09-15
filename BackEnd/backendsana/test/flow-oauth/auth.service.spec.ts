import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AccountState } from '../../src/models/account-state.enum.js';
import { AuthService } from '../../src/services/auth.service.js';

const profile = {
  subject: 'auth0|user-1',
  email: 'user@example.com',
  name: 'User',
  isEmailVerified: true,
};

function setup(recordOverrides: Record<string, unknown> = {}) {
  const record = {
    personId: 10,
    userId: 10,
    providerId: profile.subject,
    email: profile.email,
    state: AccountState.Active,
    roles: ['psicologo'],
    ...recordOverrides,
  };
  const repository = {
    findByProviderId: vi.fn().mockResolvedValue(record),
    findByEmail: vi.fn(),
    createPending: vi.fn(),
    claim: vi.fn(),
    updateEmail: vi.fn(),
    updateLastLogin: vi.fn(),
  };
  const securityLogService = { logUnauthorizedAccess: vi.fn() };
  return {
    service: new AuthService(repository as never, securityLogService as never),
    repository,
  };
}

describe('AuthService.authorizeAuth0', () => {
  it('returns the local user and roles for an authorized Auth0 identity', async () => {
    const { service, repository } = setup();
    await expect(service.authorizeAuth0(profile)).resolves.toEqual({
      userId: 10,
      personId: 10,
      email: profile.email,
      roles: ['psicologo'],
      auth0Subject: profile.subject,
    });
    expect(repository.updateLastLogin).toHaveBeenCalledWith(10);
  });

  it('creates a pending request when the Auth0 email is unknown', async () => {
    const { service, repository } = setup();
    repository.findByProviderId.mockResolvedValue(null);
    repository.findByEmail.mockResolvedValue(null);

    await expect(service.authorizeAuth0(profile)).rejects.toThrow(
      'Access request is pending',
    );
    expect(repository.createPending).toHaveBeenCalledWith(
      profile.email,
      profile.name,
    );
  });

  it.each([
    { state: AccountState.Inactive },
    { roles: ['consultante'] },
  ])('rejects a local account that is not authorized', async (overrides) => {
    const { service } = setup(overrides);
    await expect(service.authorizeAuth0(profile)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
