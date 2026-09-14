import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsPositive } from 'class-validator';

export class AssignedRoleDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  roleId!: number;

  @IsBoolean()
  active!: boolean;
}
