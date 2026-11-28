/**
 * Frontend-only visibility switches. Turning one off hides its UI;
 * backend endpoints, tables and data are left untouched.
 */
export const FEATURES = {
  /** "Nuestros programas" section, nav links and content editor. Set to true to show them again. */
  programs: false,
} as const;
