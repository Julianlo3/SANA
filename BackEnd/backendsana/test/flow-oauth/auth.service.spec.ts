import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AccountState } from '../../src/models/account-state.enum.js';
import { AuthService } from '../../src/services/auth.service.js';

const profile = {
  googleId: 'google-id',
  email: ' User@Example.com ',
  name: 'User',
  isEmailVerified: true,
};

function record(overrides: Record<string, unknown> = {}) {
  return {
    personId: 10,
    userId: 10,
    providerId: 'google-id',
    email: 'user@example.com',
    state: AccountState.Active,
    roles: ['psicologo'],
    ...overrides,
  };
}

function setup() {
  // Reemplaza repositorio, JWT y base de datos por espías sin efectos externos.
  const repository = {
    findByProviderId: vi.fn(),
    findByEmail: vi.fn(),
    createPending: vi.fn(),
    claim: vi.fn(),
    updateEmail: vi.fn(),
    findByUserId: vi.fn(),
  };
  const dataSource = {
    query: vi.fn(),
    manager: { query: vi.fn() },
    transaction: vi.fn(),
  };
  const jwt = { signAsync: vi.fn(), verifyAsync: vi.fn() };
  const config = {
    getOrThrow: vi.fn(
      (key: string) =>
        ({
          JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL ?? '7d',
          JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL ?? '15m',
          JWT_REFRESH_SECRET:
            process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret',
          JWT_ACCESS_SECRET:
            process.env.JWT_ACCESS_SECRET ?? 'test-access-secret',
          SESSION_IDLE_TTL_MINUTES: Number(
            process.env.SESSION_IDLE_TTL_MINUTES ?? 30,
          ),
        })[key],
    ),
  };
  return {
    service: new AuthService(
      repository as never,
      dataSource as never,
      jwt as never,
      config as never,
    ),
    repository,
    dataSource,
    jwt,
  };
}

describe('AuthService.signIn', () => {
  it('rejects an unverified Google email before querying data', async () => {
    const { service, repository } = setup();
    await expect(
      service.signIn({ ...profile, isEmailVerified: false }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.findByProviderId).not.toHaveBeenCalled();
  });

  it('creates a pending request for an unknown email and denies access', async () => {
    const { service, repository } = setup();
    repository.findByProviderId.mockResolvedValue(null);
    repository.findByEmail.mockResolvedValue(null);

    await expect(service.signIn(profile)).rejects.toThrow(
      'Access request is pending',
    );
    expect(repository.createPending).toHaveBeenCalledWith(
      'user@example.com',
      'User',
    );
  });

  it('claims an existing person and rejects it if the claimed account cannot be read back', async () => {
    const { service, repository } = setup();
    repository.findByProviderId.mockResolvedValue(null);
    repository.findByEmail.mockResolvedValue(
      record({ userId: null, providerId: null }),
    );

    await expect(service.signIn(profile)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(repository.claim).toHaveBeenCalledWith(10, 'google-id');
  });

  it.each([
    [record({ state: AccountState.Inactive })],
    [record({ roles: ['consultante'] })],
  ])(
    'denies authenticated Google accounts that are not allowed',
    async (authorizationRecord) => {
      const { service, repository } = setup();
      repository.findByProviderId.mockResolvedValue(authorizationRecord);
      await expect(service.signIn(profile)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    },
  );

  it('updates a changed email before creating a session', async () => {
    const { service, repository, dataSource, jwt } = setup();
    repository.findByProviderId.mockResolvedValue(
      record({ email: 'old@example.com' }),
    );
    jwt.signAsync
      .mockResolvedValueOnce('refresh')
      .mockResolvedValueOnce('access');
    dataSource.manager.query.mockResolvedValue([]);

    await expect(service.signIn(profile)).resolves.toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    expect(repository.updateEmail).toHaveBeenCalledWith(10, 'user@example.com');
    expect(dataSource.manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO auth_sessions'),
      expect.any(Array),
    );
  });
});

describe('AuthService.authenticate', () => {
  it('rejects a token verified with the wrong token type', async () => {
    const { service, jwt } = setup();
    jwt.verifyAsync.mockResolvedValue({ tokenType: 'refresh' });
    await expect(service.authenticate('token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a valid token whose session has expired or been revoked', async () => {
    const { service, jwt, dataSource } = setup();
    jwt.verifyAsync.mockResolvedValue({
      tokenType: 'access',
      sessionId: 'session',
      sub: 10,
    });
    dataSource.manager.query.mockResolvedValue([]);
    await expect(service.authenticate('token')).rejects.toThrow(
      'Session expired',
    );
  });
});
// Un correo sin verificar no puede crear ni consultar cuentas locales.
// El usuario nuevo debe esperar aprobación en vez de recibir tokens.
// Protege la carrera donde la vinculación de Google no queda disponible después del INSERT.
// Tener identidad de Google no es suficiente: la cuenta debe estar activa y autorizada.
// Sincroniza el correo de Google antes de firmar tokens y guardar la sesión.
// Un refresh token nunca puede usarse como access token.
// La firma JWT válida no concede acceso si la sesión ya no existe.
