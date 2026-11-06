import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsPositive } from 'class-validator';

/** Validates a role assignment and whether that assignment remains active. */
export class AssignedRoleDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  roleId!: number;

  @IsBoolean()
  active!: boolean;
}
