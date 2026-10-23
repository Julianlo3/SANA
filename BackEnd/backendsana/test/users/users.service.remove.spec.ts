import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../../src/users/users.service.js';

describe('UsersService.remove', () => {
  it('archives the account and writes the audit entry in the same transaction', async () => {
    const person = {
      perId: 15,
      perState: 'activo',
      perUpdateDate: null,
    };
    const manager = {
      findOneBy: vi.fn().mockResolvedValue(person),
      save: vi.fn(async (value: typeof person) => value),
      query: vi.fn().mockResolvedValue(undefined),
    };
    const dataSource = {
      transaction: vi.fn(
        async (operation: (transactionManager: typeof manager) => unknown) =>
          operation(manager),
      ),
    };
    const service = new UsersService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      dataSource as never,
      {} as never,
    );

    await service.remove(15, 7);

    expect(person.perState).toBe('bloqueado');
    expect(manager.save).toHaveBeenCalledWith(person);
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO security_access_log'),
      [
        7,
        "Admin changed person 15 status to 'blocked': Baja lógica desde gestión de usuarios",
      ],
    );
    expect(dataSource.transaction).toHaveBeenCalledOnce();
  });
});
