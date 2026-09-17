import { describe, expect, it, vi } from 'vitest';
import { AuthRepository } from '../../src/repositories/auth.repository.js';

describe('AuthRepository', () => {
  function setup() {
    const manager = { query: vi.fn() };
    const dataSource = { query: vi.fn(), transaction: vi.fn() };
    return {
      repository: new AuthRepository(dataSource as never),
      dataSource,
      manager,
    };
  }

  it('returns the first authorization record, or null when a search has no rows', async () => {
    const { repository, dataSource } = setup();
    dataSource.query
      .mockResolvedValueOnce([{ personId: 1 }])
      .mockResolvedValueOnce([]);

    await expect(repository.findByEmail('user@example.com')).resolves.toEqual({
      personId: 1,
    });
    await expect(repository.findByUserId(1)).resolves.toBeNull();
    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('lower(p.per_email)'),
      ['user@example.com'],
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('WHERE u.use_id=$1'),
      [1],
    );
  });

  it('queries an Auth0 provider identity by provider ID', async () => {
    const { repository, dataSource } = setup();
    dataSource.query.mockResolvedValue([]);

    await repository.findByProviderId('auth0-subject');

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('u.user_provider_id=$1'),
      ['auth0-subject'],
    );
  });

  it('updates email and claims a person using parameterized queries', async () => {
    const { repository, dataSource } = setup();
    dataSource.query.mockResolvedValue([]);

    await repository.updateEmail(4, 'new@example.com');
    await repository.claim(4, 'auth0-subject', 'auth0', true);

    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE person SET'),
      ['new@example.com', 4],
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO users'),
      [4, 'auth0-subject', 'auth0', true],
    );
  });

  it('creates the pending person, role and access request in one transaction', async () => {
    const { repository, dataSource, manager } = setup();
    manager.query.mockResolvedValueOnce([{ per_id: 9 }]).mockResolvedValue([]);
    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );

    await repository.createPending('new@example.com', 'New user');

    expect(dataSource.transaction).toHaveBeenCalledOnce();
    expect(manager.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO person'),
      ['New user', 'new@example.com', 'pendiente'],
    );
    expect(manager.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO person_rol'),
      [9],
    );
    expect(manager.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO access_requests'),
      [9],
    );
  });
});
// Los valores del usuario se pasan como parámetros SQL, no se interpolan en la consulta.
// El repositorio asume 'auth0' cuando el servicio no indica otro proveedor.
// Vincular la cuenta conserva el id de persona y añade el identificador del proveedor Auth0.
// Las tres inserciones comparten la misma transacción para evitar solicitudes a medias.
