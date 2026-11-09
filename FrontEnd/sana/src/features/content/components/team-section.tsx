"use client";

import { startTransition, useState } from "react";
import TeamCarousel from "@/features/content/components/team-carousel";
import type { PublicTeamCard, TeamGroup } from "@/features/content/types/content-types";

type Props = {
  members: PublicTeamCard[];
  titles: Record<TeamGroup, string>;
};

const GROUP_ORDER: TeamGroup[] = ["staff", "professional"];

/**
 * Public team section split into one carousel per group; empty groups are not shown.
 */
export default function TeamSection({ members, titles }: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const blocks = GROUP_ORDER.map((group) => ({
    group,
    title: titles[group],
    members: members.filter((member) => member.teamGroup === group),
  })).filter((block) => block.members.length > 0);

  return (
    <div className="space-y-16">
      {blocks.map((block) => (
        <div key={block.group}>
          <h2
            id={`team-${block.group}`}
            className="font-display text-3xl font-extrabold text-white sm:text-4xl"
          >
            {block.title}
          </h2>
          <span aria-hidden className="mt-4 block h-1 w-12 rounded-full bg-support-blue" />
          <TeamCarousel
            members={block.members}
            group={block.group}
            labelledBy={`team-${block.group}`}
            isPausedByOther={isProfileOpen}
            onProfileOpenChange={(isOpen) =>
              startTransition(() => setIsProfileOpen(isOpen))
            }
          />
        </div>
      ))}
    </div>
  );
}
