/**
 * Represents a Google user profile obtained from the Google Identity service.
 */
export interface GoogleProfile {
  email: string;
  name: string;
  googleId: string;
  isEmailVerified: boolean;
}
/**
 * Represents an authenticated user in the system.
 */
export interface AuthenticatedUser {
  userId: number;
  personId: number;
  email: string;
  roles: string[];
  sessionId: string;
}
/**
 * Represents a pair of access and refresh tokens.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
/**
 * Represents the payload of a JWT token used for authentication.
 */
export interface JwtPayload {
  sub: number;
  personId: number;
  email: string;
  roles: string[];
  sessionId: string;
  tokenType: 'access' | 'refresh';
}
