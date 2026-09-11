import { IsJWT, IsString, MaxLength } from 'class-validator';

/**
 * Data Transfer Object for Google Sign-In.
 * This DTO is used to validate the incoming request payload for Google Sign-In.
 */
export class GoogleSignInDto {
  @IsJWT()
  idToken: string;

  @IsString()
  @MaxLength(512)
  nonce: string;
}
