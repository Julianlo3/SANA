// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ValuesPath from "@/features/content/components/values-path";
import { HOME_CONTENT } from "@/content/home";
import type { PublicContentCard } from "@/features/content/types/content-types";

afterEach(cleanup);

const TITLES = [
  "Empatía",
  "Respeto",
  "Confidencialidad",
  "Compromiso",
  "Trabajo en equipo",
  "Alegría",
];

function values(count: number): PublicContentCard[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: TITLES[index % TITLES.length],
    subtitle: null,
    description: index % 2 === 0 ? "Descripción del valor." : null,
    imageUrl: null,
    imageAlt: null,
  }));
}

describe("ValuesPath", () => {
  it("renderiza una parada por valor con su título como heading", () => {
    render(<ValuesPath values={values(6)} />);

    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(6);
    for (const title of TITLES) {
      expect(
        within(list).getByRole("heading", { level: 3, name: title }),
      ).toBeTruthy();
    }
  });

  it("sin valores muestra el título y el aviso, sin lista", () => {
    render(<ValuesPath values={[]} />);

    expect(
      screen.getByRole("heading", { level: 2, name: HOME_CONTENT.about.valuesTitle }),
    ).toBeTruthy();
    expect(screen.getByText("Información próxima a actualizarse.")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("no usa huellas de animal", () => {
    const { container } = render(<ValuesPath values={values(6)} />);

    // PawPrint es el único SVG del proyecto con este viewBox.
    expect(container.querySelector('svg[viewBox="0 0 64 64"]')).toBeNull();
  });
});
