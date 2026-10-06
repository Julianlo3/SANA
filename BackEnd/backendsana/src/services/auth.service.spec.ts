import { AuthService } from './auth.service.js';
import type { AuthRepository, AuthorizationRecord } from '../repositories/auth.repository.js';
import type { SecurityLogService } from './security-log.service.js';

describe('AuthService', () => {
  it('claims a consultant person record using their verified Auth0 identity', async () => {
    const unclaimedRecord: AuthorizationRecord = {
      personId: 42,
      name: 'Ana Consultante',
      email: 'ana@example.com',
      state: 'activo',
      userId: null,
      providerId: null,
      providerName: null,
      roles: ['consultante'],
      termsAccepted: true,
      psyTermsAccepted: null,
    };
    const claimedRecord: AuthorizationRecord = {
      ...unclaimedRecord,
      userId: 42,
      providerId: 'google-oauth2|ana',
      providerName: 'google-oauth2',
    };

    const repository = {
      findByProviderId: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(claimedRecord),
      findByEmail: vi.fn().mockResolvedValue(unclaimedRecord),
      claim: vi.fn().mockResolvedValue(undefined),
      updateLastLogin: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthRepository;
    const securityLogService = {} as SecurityLogService;
    const service = new AuthService(repository, securityLogService);

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
      state: 'activo',
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
});
