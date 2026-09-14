import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const USER_STATUSES = ['active', 'inactive', 'blocked'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export class UpdateUserStatusDto {
  @IsIn(USER_STATUSES)
  status!: UserStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
