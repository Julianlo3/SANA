import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEmail, Min } from 'class-validator';

export class RegisterDonationDto {
  @IsString()
  @IsNotEmpty()
  wompiTransactionId!: string;

  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsNumber()
  @Min(100)
  amountInCents!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsOptional()
  paymentMethodType?: string;

  @IsEmail()
  @IsOptional()
  donorEmail?: string;

  @IsString()
  @IsOptional()
  donorFullName?: string;

  @IsString()
  @IsOptional()
  environment?: string;

  @IsOptional()
  wompiCreatedAt?: string;
}
