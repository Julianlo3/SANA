import type { LucideIcon } from "lucide-react";
import { Brain, Heart, HeartHandshake, MessageCircleHeart } from "lucide-react";
import type { TeamGroup } from "@/features/content/types/content-types";

export type CardBand = {
  background: string;
  glowColor: string;
  LeftIcon: LucideIcon;
  leftIconClassName: string;
  fillLeftIcon: boolean;
  RightIcon: LucideIcon;
  rightIconClassName: string;
  ringClassName: string;
};

/**
 * Colors and symbols that distinguish each team group in its cards and expanded profile.
 */
export const CARD_BANDS: Record<TeamGroup, CardBand> = {
  staff: {
    background: "bg-support-blue",
    glowColor: "var(--color-support-blue)",
    LeftIcon: Heart,
    leftIconClassName: "text-accent/70",
    fillLeftIcon: true,
    RightIcon: HeartHandshake,
    rightIconClassName: "text-navy/60",
    ringClassName: "border-primary",
  },
  professional: {
    background: "bg-highlight",
    glowColor: "var(--color-highlight)",
    LeftIcon: Brain,
    leftIconClassName: "text-accent/70",
    fillLeftIcon: false,
    RightIcon: MessageCircleHeart,
    rightIconClassName: "text-primary-dark/80",
    ringClassName: "border-support-blue",
  },
};
