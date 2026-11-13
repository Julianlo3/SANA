// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import MissionVisionTabs from "@/features/content/components/mission-vision-tabs";

afterEach(cleanup);

function renderTabs(vision: string | null = "Texto de visión") {
  render(
    <MissionVisionTabs
      mission="Texto de misión"
      vision={vision}
      missionTitle="Misión"
      visionTitle="Visión"
    />,
  );

  return {
    mission: screen.getByRole("tab", { name: "Misión" }),
    vision: screen.getByRole("tab", { name: "Visión" }),
  };
}

describe("MissionVisionTabs", () => {
  it("arranca en la pestaña de misión", () => {
    const { mission, vision } = renderTabs();

    expect(mission.getAttribute("aria-selected")).toBe("true");
    expect(vision.getAttribute("aria-selected")).toBe("false");
    expect(screen.getByRole("tabpanel").textContent).toContain("Texto de misión");
  });

  it("al hacer clic en visión muestra su texto", () => {
    const { mission, vision } = renderTabs();

    fireEvent.click(vision);

    expect(vision.getAttribute("aria-selected")).toBe("true");
    expect(mission.getAttribute("aria-selected")).toBe("false");
    expect(screen.getByRole("tabpanel").textContent).toContain("Texto de visión");
  });

  it("cambia de pestaña con las flechas del teclado", () => {
    const { mission, vision } = renderTabs();

    fireEvent.keyDown(mission, { key: "ArrowRight" });
    expect(vision.getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(vision, { key: "ArrowLeft" });
    expect(mission.getAttribute("aria-selected")).toBe("true");
  });

  it("muestra el aviso de contenido pendiente cuando la visión es nula", () => {
    const { vision } = renderTabs(null);

    fireEvent.click(vision);

    expect(screen.getByRole("tabpanel").textContent).toContain(
      "Información próxima a actualizarse.",
    );
  });
});
