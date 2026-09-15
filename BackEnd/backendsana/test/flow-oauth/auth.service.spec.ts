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
    providerName: 'auth0',
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
    linkProvider: vi.fn(),
  };
  const securityLogService = {
    logUnauthorizedAccess: vi.fn().mockResolvedValue(undefined),
  };
  return {
    service: new AuthService(repository as never, securityLogService as never),
    repository,
    record,
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

  it('calls updateEmail when the Auth0 email differs from the stored email', async () => {
    const { service, repository } = setup({ email: 'OLD@EXAMPLE.COM' });
    // findByProviderId retorna el record con email obsoleto; tras updateEmail el servicio
    // usa el email normalizado del token OAuth.
    await expect(service.authorizeAuth0(profile)).resolves.toMatchObject({
      email: profile.email,
    });
    expect(repository.updateEmail).toHaveBeenCalledWith(10, profile.email);
  });

  it('claims a person without a user account and then authorizes them', async () => {
    const { service, repository } = setup();
    // Primera búsqueda por providerId falla → busca por email → persona sin userId
    repository.findByProviderId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        personId: 10,
        userId: 10,
        providerId: profile.subject,
        providerName: 'auth0',
        email: profile.email,
        state: AccountState.Active,
        roles: ['psicologo'],
      });
    repository.findByEmail.mockResolvedValue({
      personId: 10,
      userId: null, // sin cuenta → debe llamar a claim
      providerId: null,
      providerName: null,
      email: profile.email,
      state: AccountState.Active,
      roles: ['psicologo'],
    });

    await expect(service.authorizeAuth0(profile)).resolves.toMatchObject({
      userId: 10,
      auth0Subject: profile.subject,
    });
    expect(repository.claim).toHaveBeenCalledWith(10, profile.subject, 'auth0');
  });

  it('links a new Auth0 provider to an existing account with a different provider', async () => {
    const { service, repository } = setup();
    // Primera búsqueda por providerId falla → busca por email → persona con otro proveedor.
    // Tras linkProvider, la segunda búsqueda devuelve el record ya actualizado con el
    // subject de Auth0 para que la validación `record.providerId !== profile.subject` pase.
    repository.findByProviderId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        personId: 10,
        userId: 10,
        providerId: profile.subject,   // ← ya actualizado por linkProvider
        providerName: 'auth0',
        email: profile.email,
        state: AccountState.Active,
        roles: ['psicologo'],
      });
    repository.findByEmail.mockResolvedValue({
      personId: 10,
      userId: 10,
      providerId: 'google-oauth2|999',
      providerName: 'google-oauth2',   // distinto de 'auth0' → debe llamar a linkProvider
      email: profile.email,
      state: AccountState.Active,
      roles: ['psicologo'],
    });

    await expect(service.authorizeAuth0(profile)).resolves.toMatchObject({
      userId: 10,
      auth0Subject: profile.subject,
    });
    expect(repository.linkProvider).toHaveBeenCalledWith(10, profile.subject, 'auth0');
  });
});
