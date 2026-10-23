import { describe, expect, it, vi } from 'vitest';
import { ASSIGNABLE_ROLES } from '../../src/users/users.constants.js';
import { UsersService } from '../../src/users/users.service.js';

describe('UsersService.findAll', () => {
  it('lists employees with inactive assigned roles so administrators can manage them', async () => {
    const queryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([]),
    };
    const service = new UsersService(
      { createQueryBuilder: vi.fn().mockReturnValue(queryBuilder) } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.findAll({})).resolves.toEqual([]);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'person.per_state != :blocked',
      { blocked: 'bloqueado' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('employee_role_definition.rol_description IN'),
      { employeeRoles: ASSIGNABLE_ROLES },
    );
    expect(queryBuilder.andWhere.mock.calls[1][0]).toContain(
      'employee_role_definition.rol_description IN',
    );
    expect(queryBuilder.andWhere.mock.calls[1][0]).not.toContain(
      'employee_role.pr_active = true',
    );
    expect(queryBuilder.andWhere.mock.calls).toHaveLength(2);
  });
});
