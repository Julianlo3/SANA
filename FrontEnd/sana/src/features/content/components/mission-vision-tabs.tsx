"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import PendingContentNotice from "@/components/feedback/pending-content-notice";

type TabKey = "mission" | "vision";

type MissionVisionTabsProps = {
  mission: string | null;
  vision: string | null;
  missionTitle: string;
  visionTitle: string;
};

const TAB_ORDER: TabKey[] = ["mission", "vision"];

const ACTIVE_TEXT: Record<TabKey, string> = {
  mission: "text-primary-dark",
  vision: "text-accent-strong",
};

const CARD_FILL: Record<TabKey, string> = {
  mission: "mv-card--mission",
  vision: "mv-card--vision",
};

// Mobile version: one card with tabs (WAI-ARIA tabs pattern).
export default function MissionVisionTabs({
  mission,
  vision,
  missionTitle,
  visionTitle,
}: MissionVisionTabsProps) {
  const baseId = useId();
  const [active, setActive] = useState<TabKey>("mission");
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    mission: null,
    vision: null,
  });

  const tabs: Record<TabKey, { title: string; text: string | null }> = {
    mission: { title: missionTitle, text: mission },
    vision: { title: visionTitle, text: vision },
  };

  const tabId = (key: TabKey) => `${baseId}-tab-${key}`;
  const panelId = (key: TabKey) => `${baseId}-panel-${key}`;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const index = TAB_ORDER.indexOf(active);
    const next = TAB_ORDER[(index + step + TAB_ORDER.length) % TAB_ORDER.length];
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <article className={`mv-card ${CARD_FILL[active]} rounded-[26px] px-5 pb-7 pt-5`}>
      <div
        role="tablist"
        aria-label="Misión y visión"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-2 gap-1 rounded-full bg-white/75 p-1 ring-1 ring-border"
      >
        {TAB_ORDER.map((key) => {
          const selected = key === active;

          return (
            <button
              key={key}
              ref={(node) => {
                tabRefs.current[key] = node;
              }}
              type="button"
              role="tab"
              id={tabId(key)}
              aria-selected={selected}
              aria-controls={panelId(key)}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(key)}
              className={`rounded-full py-2.5 font-display text-sm font-extrabold transition-colors ${
                selected ? `bg-surface shadow-sm ${ACTIVE_TEXT[key]}` : "text-text-muted"
              }`}
            >
              {tabs[key].title}
            </button>
          );
        })}
      </div>

      {TAB_ORDER.map((key) => (
        <div
          key={key}
          role="tabpanel"
          id={panelId(key)}
          aria-labelledby={tabId(key)}
          tabIndex={0}
          hidden={key !== active}
          className="mt-5 px-2 motion-safe:animate-[mv-fade-in_300ms_ease-out]"
        >
          {tabs[key].text ? (
            <p className="hyphens-auto whitespace-pre-line text-justify leading-relaxed text-text-muted">
              {tabs[key].text}
            </p>
          ) : (
            <PendingContentNotice />
          )}
        </div>
      ))}
    </article>
  );
}
