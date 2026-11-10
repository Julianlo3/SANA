import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const MIN_DONATION_IN_CENTS = 1_000 * 100;
export const MAX_DONATION_IN_CENTS = 50_000_000 * 100;

/**
 * DTO for starting a Wompi donation checkout.
 * The amount already includes the Wompi fee when the donor chose to cover it.
 */
export class CreateDonationCheckoutDto {
  @IsInt()
  @Min(MIN_DONATION_IN_CENTS)
  @Max(MAX_DONATION_IN_CENTS)
  amountInCents!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  donorFullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  donorEmail?: string;

  @IsBoolean()
  termsAccepted!: boolean;
}
