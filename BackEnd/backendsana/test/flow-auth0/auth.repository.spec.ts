import { describe, expect, it, vi } from 'vitest';
import { AuthRepository } from '../../src/auth/auth.repository.js';

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
      .mockResolvedValueOnce([{ personId: 1, name: 'Local Person' }])
      .mockResolvedValueOnce([]);

    await expect(repository.findByEmail('user@example.com')).resolves.toEqual({
      personId: 1,
      name: 'Local Person',
    });
    await expect(repository.findByUserId(1)).resolves.toBeNull();
    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('lower(p.per_email)'),
      ['user@example.com'],
    );
    expect(dataSource.query.mock.calls[0][0]).toContain(
      'p.per_name AS name',
    );
    expect(dataSource.query.mock.calls[0][0]).toContain(
      "ARRAY['account_terms', 'terms_of_use', 'privacy_policy']",
    );
    expect(dataSource.query.mock.calls[0][0]).not.toContain(
      "'data_treatment'",
    );
    expect(dataSource.query.mock.calls[0][0]).not.toContain(
      'per_termns_accpted',
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('WHERE u.use_id=$1'),
      [1],
    );
    expect(dataSource.query.mock.calls[1][0]).toContain(
      'p.per_name AS name',
    );
    expect(dataSource.query.mock.calls[1][0]).not.toContain(
      'psy_termns_accpted',
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
    expect(dataSource.query.mock.calls[0][0]).toContain(
      'p.per_name AS name',
    );
    expect(dataSource.query.mock.calls[0][0]).toContain(
      "pd.pd_type = 'schedule_terms'",
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

  it('creates the pending person and role in one transaction', async () => {
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
    expect(manager.query).toHaveBeenCalledTimes(2);
  });

  it('records account terms, terms of use and privacy policy with the IP in a single insert', async () => {
    const { repository, dataSource } = setup();
    dataSource.query
      .mockResolvedValueOnce([
        { pd_type: 'privacy_policy', pd_id: 5 },
        { pd_type: 'account_terms', pd_id: 9 },
        { pd_type: 'terms_of_use', pd_id: 6 },
      ])
      .mockResolvedValueOnce([]);

    await repository.acceptTerms(42, '203.0.113.7');

    expect(dataSource.query).toHaveBeenCalledTimes(2);
    expect(dataSource.query.mock.calls[0][0]).toContain('DISTINCT ON (pd_type)');
    expect(dataSource.query.mock.calls[0][1]).toEqual([
      ['account_terms', 'terms_of_use', 'privacy_policy'],
    ]);
    expect(dataSource.query.mock.calls[1][0]).toContain('unnest($2::int[])');
    expect(dataSource.query.mock.calls[1][0]).toContain("'web'");
    expect(dataSource.query.mock.calls[1][1]).toEqual([42, [9, 6, 5], '203.0.113.7']);
    expect(JSON.stringify(dataSource.query.mock.calls)).not.toContain('data_treatment');
  });

  it('records nothing when one of the account documents is missing', async () => {
    const { repository, dataSource } = setup();
    dataSource.query.mockResolvedValueOnce([
      { pd_type: 'account_terms', pd_id: 9 },
      { pd_type: 'privacy_policy', pd_id: 5 },
    ]);

    await expect(repository.acceptTerms(42)).rejects.toThrow(
      'No policy document found for type: terms_of_use',
    );
    expect(dataSource.query).toHaveBeenCalledOnce();
  });
});
// Los valores del usuario se pasan como parámetros SQL, no se interpolan en la consulta.
// El repositorio asume 'auth0' cuando el servicio no indica otro proveedor.
// Vincular la cuenta conserva el id de persona y añade el identificador del proveedor Auth0.
// Las inserciones comparten la misma transacción para evitar solicitudes a medias.
