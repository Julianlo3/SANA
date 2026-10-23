// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MissionVisionForm from "@/features/content/components/mission-vision-form";
import {
  getContentItems,
  saveContentItems,
} from "@/features/content/services/content-service";
import type { ContentItem } from "@/features/content/types/content-types";

vi.mock("@/features/content/services/content-service", () => ({
  getContentItems: vi.fn(),
  saveContentItems: vi.fn(),
}));

vi.mock("@/features/content/actions/refresh-public-content", () => ({
  refreshPublicContent: vi.fn(),
}));

const initialItems: ContentItem[] = [
  {
    key: "about.mission",
    value: "Misión publicada",
    updatedAt: null,
    updatedBy: null,
  },
  {
    key: "about.vision",
    value: "Visión publicada",
    updatedAt: null,
    updatedBy: null,
  },
];

describe("MissionVisionForm cancel behavior (HU-4.1)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getContentItems).mockResolvedValue(initialItems);
  });

  afterEach(() => cleanup());

  it("discards unsaved edits and keeps the published values", async () => {
    render(<MissionVisionForm />);

    const mission = (await screen.findByLabelText(
      /Misión/,
    )) as HTMLTextAreaElement;
    const vision = screen.getByLabelText(/Visión/) as HTMLTextAreaElement;
    expect(mission.value).toBe("Misión publicada");
    expect(vision.value).toBe("Visión publicada");

    fireEvent.change(mission, { target: { value: "Cambio sin guardar" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(mission.value).toBe("Misión publicada");
    expect(vision.value).toBe("Visión publicada");
    expect(saveContentItems).not.toHaveBeenCalled();
  });
});
