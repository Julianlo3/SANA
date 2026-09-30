"use client";

import { useState } from "react";
import PageDecor from "@/components/ui/page-decor";
import CardSectionEditor from "../components/card-section-editor";
import MissionVisionForm from "../components/mission-vision-form";
import { CARD_SECTIONS } from "../config/content-sections";

const MISSION_VISION_TAB = "mission-vision";

const TABS = [
  { id: MISSION_VISION_TAB, label: "Misión y visión" },
  ...CARD_SECTIONS.map((config) => ({ id: config.section, label: config.label })),
];

export default function InstitutionalContentPage() {
  const [activeTab, setActiveTab] = useState<string>(MISSION_VISION_TAB);
  const activeSection = CARD_SECTIONS.find(
    (config) => config.section === activeTab,
  );

  return (
    <>
      <PageDecor variant="default" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-primary-dark sm:text-4xl">
          Contenido institucional
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-muted">
          Lo que guardes aquí se publica de inmediato en el sitio de la
          fundación.
        </p>

        <div
          role="tablist"
          aria-label="Secciones del contenido institucional"
          className="mt-8 flex gap-2 overflow-x-auto pb-1"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="mt-6">
          {activeSection ? (
            <CardSectionEditor key={activeSection.section} config={activeSection} />
          ) : (
            <MissionVisionForm />
          )}
        </div>
      </div>
    </>
  );
}
