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
    name: 'Local Person',
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
      name: 'Local Person',
      email: profile.email,
      roles: ['psicologo'],
      auth0Subject: profile.subject,
      state: AccountState.Active,
      termsAccepted: false,
      psyTermsAccepted: null,
    });
    expect(repository.updateLastLogin).toHaveBeenCalledWith(10);
  });

  it('returns an active local user without assigned roles', async () => {
    const { service } = setup({ roles: [] });

    await expect(service.authorizeAuth0(profile)).resolves.toMatchObject({
      userId: 10,
      roles: [],
      state: AccountState.Active,
    });
  });

  it('rejects an Auth0 identity with an unknown email', async () => {
    const { service, repository } = setup();
    repository.findByProviderId.mockResolvedValue(null);
    repository.findByEmail.mockResolvedValue(null);

    await expect(service.authorizeAuth0(profile)).rejects.toThrow(
      'Account not found. Contact an administrator.',
    );
    expect(repository.createPending).not.toHaveBeenCalled();
  });

  it.each([
    { state: AccountState.Inactive },
    { roles: ['pendiente'] },
  ])('rejects a local account that is not authorized', async (overrides) => {
    const { service } = setup(overrides);
    await expect(service.authorizeAuth0(profile)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('calls updateEmail when the Auth0 email differs from the stored email', async () => {
    const { service, repository } = setup({ email: 'OLD@EXAMPLE.COM' });
    // findByProviderId retorna el record con email obsoleto; tras updateEmail el servicio
    // usa el email normalizado del token Auth0.
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
    expect(repository.claim).toHaveBeenCalledWith(
      10,
      profile.subject,
      'auth0',
      true,
    );
  });

  it('claims a consultant person record using their verified Auth0 identity', async () => {
    const { service, repository } = setup({
      personId: 42,
      name: 'Ana Consultante',
      email: 'ana@example.com',
      userId: null,
      providerId: null,
      providerName: null,
      roles: ['consultante'],
      termsAccepted: true,
      psyTermsAccepted: null,
    });
    const claimedRecord = {
      personId: 42,
      name: 'Ana Consultante',
      email: 'ana@example.com',
      userId: 42,
      providerId: 'google-oauth2|ana',
      providerName: 'google-oauth2',
      state: AccountState.Active,
      roles: ['consultante'],
      termsAccepted: true,
      psyTermsAccepted: null,
    };
    repository.findByProviderId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(claimedRecord);
    repository.findByEmail.mockResolvedValue({
      ...claimedRecord,
      userId: null,
      providerId: null,
      providerName: null,
    });

    await expect(
      service.authorizeAuth0({
        subject: 'google-oauth2|ana',
        email: 'ANA@example.com',
        name: 'Ana Consultante',
        isEmailVerified: true,
      }),
    ).resolves.toEqual({
      userId: 42,
      personId: 42,
      name: 'Ana Consultante',
      email: 'ana@example.com',
      roles: ['consultante'],
      auth0Subject: 'google-oauth2|ana',
      state: AccountState.Active,
      termsAccepted: true,
      psyTermsAccepted: null,
    });

    expect(repository.claim).toHaveBeenCalledWith(
      42,
      'google-oauth2|ana',
      'google-oauth2',
      true,
    );
    expect(repository.updateLastLogin).toHaveBeenCalledWith(42);
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
    expect(repository.linkProvider).toHaveBeenCalledWith(
      10,
      profile.subject,
      'auth0',
      true,
    );
  });
});
