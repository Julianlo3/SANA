/**
 * The current version of the privacy policy used in the application.
 * This value is read from the environment variable `POLICY_VERSION` or defaults to 'privacy-policy-2026-01'.
 */
export const CURRENT_POLICY_VERSION =
  process.env.POLICY_VERSION ?? 'privacy-policy-2026-01';
