import type { UserStatus } from "../types/user-types";

/**
 * Defines user name classes.
 */
export const USER_NAME_CLASSES: Record<UserStatus, string> = {
  blocked: "text-danger",
  inactive: "text-text-subtle",
  active: "text-text",
  pending: "text-text",
};

/**
 * Defines user card avatar classes.
 */
export const USER_CARD_AVATAR_CLASSES: Record<UserStatus, string> = {
  blocked: "bg-danger text-white",
  inactive: "bg-surface-muted text-text-subtle",
  active: "bg-accent text-white",
  pending: "bg-accent text-white",
};

/**
 * Defines user row avatar classes.
 */
export const USER_ROW_AVATAR_CLASSES: Record<UserStatus, string> = {
  blocked: "bg-danger text-white",
  inactive: "bg-surface-muted text-text-subtle",
  active: "bg-primary text-white",
  pending: "bg-primary text-white",
};
