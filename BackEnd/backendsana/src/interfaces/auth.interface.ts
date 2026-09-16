/**
 * Represents an authenticated user in the system.
 */
export interface AuthenticatedUser {
  userId: number;
  personId: number;
  email: string;
  roles: string[];
  auth0Subject: string;
  state?: string;
}
