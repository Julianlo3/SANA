/**
 * Represents an authenticated user in the system.
 */
export interface AuthenticatedUser {
  userId: number;
  personId: number;
  name: string;
  email: string;
  roles: string[];
  auth0Subject: string;
  state: string;
  termsAccepted: boolean;
  psyTermsAccepted?: boolean | null;
}
