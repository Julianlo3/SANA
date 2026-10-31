import type { UserStatus } from "../types/user-types";

export const USER_NAME_CLASSES: Record<UserStatus, string> = {
  blocked: "text-danger",
  inactive: "text-text-subtle",
  active: "text-text",
  pending: "text-text",
};

export const USER_CARD_AVATAR_CLASSES: Record<UserStatus, string> = {
  blocked: "bg-danger text-white",
  inactive: "bg-surface-muted text-text-subtle",
  active: "bg-accent text-white",
  pending: "bg-accent text-white",
};

export const USER_ROW_AVATAR_CLASSES: Record<UserStatus, string> = {
  blocked: "bg-danger text-white",
  inactive: "bg-surface-muted text-text-subtle",
  active: "bg-primary text-white",
  pending: "bg-primary text-white",
};
