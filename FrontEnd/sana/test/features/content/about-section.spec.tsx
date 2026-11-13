// @vitest-environment jsdom

import type { ImgHTMLAttributes } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AboutSection from "@/features/content/components/about-section";
import { HOME_CONTENT } from "@/content/home";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    const imageProps = { ...props };
    delete imageProps.fill;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...imageProps} alt={props.alt ?? ""} />;
  },
}));

afterEach(cleanup);

describe("AboutSection", () => {
  it("muestra avisos de contenido pendiente cuando misión y visión no tienen texto", () => {
    render(<AboutSection mission={null} vision={null} />);

    expect(
      screen.getAllByText("Información próxima a actualizarse.").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("conserva el título principal y el id de la sección", () => {
    const { container } = render(<AboutSection mission="Misión" vision="Visión" />);

    expect(
      screen.getByRole("heading", { level: 2, name: HOME_CONTENT.about.title }),
    ).toBeTruthy();
    expect(container.querySelector("section#about")).not.toBeNull();
  });
});
