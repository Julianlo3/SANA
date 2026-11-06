import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** States that an administrator may assign through the user-status endpoint. */
export const USER_STATUSES = ['active', 'inactive'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Validates an administrative user-status change and its optional reason. */
export class UpdateUserStatusDto {
  @IsIn(USER_STATUSES)
  status!: UserStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
